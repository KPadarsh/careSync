import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import { FollowUp, Patient, Doctor } from "@/models";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, today, upcoming, overdue, completed
    const search = searchParams.get("search")?.trim().toLowerCase();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const followUps = await FollowUp.find({
      $or: [{ doctorId }, { status: { $in: ["pending", "scheduled"] } }],
    })
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth phone allergies",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty")
      .populate("scheduledAppointmentId", "date timeSlot status")
      .sort({ recommendedDate: 1 })
      .lean();

    const formatted = followUps
      .map((f: any) => {
        const patientName =
          f.patientId?.userId?.name ||
          `${f.patientId?.firstName || ""} ${f.patientId?.lastName || ""}`.trim() ||
          "Patient";

        const age = f.patientId?.dateOfBirth
          ? Math.floor(
              (Date.now() - new Date(f.patientId.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 32;

        const recDate = new Date(f.recommendedDate);
        let category: "today" | "upcoming" | "overdue" | "completed" = "upcoming";

        if (f.status === "completed") {
          category = "completed";
        } else if (recDate < todayStart) {
          category = "overdue";
        } else if (recDate >= todayStart && recDate < todayEnd) {
          category = "today";
        } else {
          category = "upcoming";
        }

        return {
          _id: f._id.toString(),
          recommendedDate: f.recommendedDate,
          reason: f.reason,
          clinicalInstructions: f.clinicalInstructions,
          status: f.status,
          category,
          scheduledAppointment: f.scheduledAppointmentId
            ? {
                date: f.scheduledAppointmentId.date,
                timeSlot: f.scheduledAppointmentId.timeSlot,
                status: f.scheduledAppointmentId.status,
              }
            : null,
          patient: {
            _id: f.patientId?._id?.toString(),
            name: patientName,
            mrn: f.patientId?.mrn || "MRN-N/A",
            age,
            gender: f.patientId?.gender || "male",
            bloodGroup: f.patientId?.bloodGroup || "O+",
            phone: f.patientId?.phone || f.patientId?.userId?.phone || "N/A",
            avatar: f.patientId?.userId?.avatar,
          },
          doctor: {
            name: f.doctorId?.name || session.doctor.name,
            specialty: f.doctorId?.specialty || session.doctor.specialty,
          },
        };
      })
      .filter((f) => {
        if (filter !== "all" && f.category !== filter) {
          return false;
        }
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          f.patient.name.toLowerCase().includes(s) ||
          f.patient.mrn.toLowerCase().includes(s) ||
          f.reason.toLowerCase().includes(s) ||
          f.clinicalInstructions.toLowerCase().includes(s)
        );
      });

    const counts = {
      all: formatted.length,
      today: formatted.filter((f) => f.category === "today").length,
      upcoming: formatted.filter((f) => f.category === "upcoming").length,
      overdue: formatted.filter((f) => f.category === "overdue").length,
      completed: formatted.filter((f) => f.category === "completed").length,
    };

    return NextResponse.json({
      followUps: formatted,
      counts,
    });
  } catch (error: any) {
    console.error("Doctor follow-ups GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load follow-ups" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;
    const body = await request.json();

    const { patientId, recommendedDate, reason, clinicalInstructions } = body;

    if (!patientId || !recommendedDate || !reason) {
      return NextResponse.json(
        { error: "Patient ID, recommended date, and clinical reason are required" },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const followUp = await FollowUp.create({
      patientId: patient._id,
      doctorId,
      recommendedDate: new Date(recommendedDate),
      reason: reason.trim(),
      clinicalInstructions: clinicalInstructions?.trim() || "Routine clinical follow-up.",
      status: "pending", // Enables receptionist scheduling
    });

    return NextResponse.json({
      success: true,
      message: "Follow-up instructions logged. Receptionist can now schedule the appointment.",
      followUp: {
        _id: followUp._id.toString(),
        status: followUp.status,
        recommendedDate: followUp.recommendedDate,
      },
    });
  } catch (error: any) {
    console.error("Doctor follow-up POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create follow-up instructions" },
      { status: 500 }
    );
  }
}
