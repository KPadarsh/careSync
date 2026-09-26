import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { Patient, Queue, NursingAssessment, Appointment, Visit, Doctor } from "@/models";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid patient ID format" }, { status: 400 });
    }

    const patient = await Patient.findById(id)
      .populate("userId", "name email phone avatar")
      .populate("primaryDoctorId", "name specialty department roomNumber")
      .lean();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Active queue for today
    const activeQueue = await Queue.findOne({
      patientId: patient._id,
      $or: [
        { checkedInTime: { $gte: todayStart, $lt: todayEnd } },
        { status: { $in: ["waiting", "in-assessment", "ready-for-doctor", "in-consultation"] } },
      ],
    })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .populate("appointmentId", "timeSlot reason status")
      .lean();

    // Today's appointment if any
    const todayAppointment = await Appointment.findOne({
      patientId: patient._id,
      date: { $gte: todayStart, $lt: todayEnd },
    })
      .populate("doctorId", "name specialty roomNumber")
      .lean();

    // All nursing assessments for history
    const nursingAssessments = await NursingAssessment.find({
      patientId: patient._id,
    })
      .populate("doctorId", "name specialty")
      .sort({ createdAt: -1 })
      .lean();

    const latestAssessment = nursingAssessments[0] || null;
    const currentVitals = latestAssessment?.vitals || null;

    // Past visits
    const pastVisits = await Visit.find({ patientId: patient._id })
      .populate("doctorId", "name specialty")
      .sort({ visitDate: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      patient,
      activeQueue,
      todayAppointment,
      currentVitals,
      latestAssessment,
      nursingRecords: nursingAssessments,
      pastVisits,
    });
  } catch (error: any) {
    console.error("Nurse patient overview GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load patient overview" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
