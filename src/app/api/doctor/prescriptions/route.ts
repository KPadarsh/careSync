import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import { Prescription, Patient, Doctor, Visit } from "@/models";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // all, active, completed, discontinued
    const search = searchParams.get("search")?.trim().toLowerCase();

    let query: any = { doctorId };

    if (status && status !== "all") {
      query.status = status.toLowerCase();
    }

    const prescriptions = await Prescription.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth allergies phone",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty qualification")
      .populate("visitId", "diagnosis reason visitDate")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = prescriptions
      .map((rx: any) => {
        const patientName =
          rx.patientId?.userId?.name ||
          `${rx.patientId?.firstName || ""} ${rx.patientId?.lastName || ""}`.trim() ||
          "Patient";

        const age = rx.patientId?.dateOfBirth
          ? Math.floor(
              (Date.now() - new Date(rx.patientId.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 32;

        return {
          _id: rx._id.toString(),
          date: rx.date || rx.createdAt,
          status: rx.status || "active",
          notes: rx.notes || "",
          patient: {
            _id: rx.patientId?._id?.toString(),
            name: patientName,
            mrn: rx.patientId?.mrn || "MRN-N/A",
            age,
            gender: rx.patientId?.gender || "male",
            bloodGroup: rx.patientId?.bloodGroup || "O+",
            allergies: rx.patientId?.allergies || [],
            avatar: rx.patientId?.userId?.avatar,
          },
          diagnosis:
            rx.visitId?.diagnosis ||
            rx.notes?.slice(0, 40) ||
            "Outpatient Clinical Regimen",
          doctor: {
            name: rx.doctorId?.name || session.doctor.name,
            specialty: rx.doctorId?.specialty || session.doctor.specialty,
            qualification: rx.doctorId?.qualification || "MD",
          },
          medications: rx.medications || [],
        };
      })
      .filter((rx) => {
        if (!search) return true;
        const s = search.toLowerCase();
        const medMatches = rx.medications.some((m: any) =>
          m.medicine.toLowerCase().includes(s)
        );
        return (
          rx.patient.name.toLowerCase().includes(s) ||
          rx.patient.mrn.toLowerCase().includes(s) ||
          rx.diagnosis.toLowerCase().includes(s) ||
          medMatches
        );
      });

    const activeCount = prescriptions.filter((p: any) => p.status === "active").length;
    const completedCount = prescriptions.filter((p: any) => p.status === "completed").length;
    const totalCount = prescriptions.length;

    return NextResponse.json({
      prescriptions: formatted,
      stats: {
        total: totalCount,
        active: activeCount,
        completed: completedCount,
      },
    });
  } catch (error: any) {
    console.error("Doctor prescriptions GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctor prescriptions" },
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

    const { patientId, medications, notes } = body;

    if (!patientId || !medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json(
        { error: "Patient ID and at least one medication item are required" },
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

    // Doctor creates prescription - available immediately to Pharmacy
    const prescription = await Prescription.create({
      patientId: patient._id,
      doctorId,
      date: new Date(),
      status: "active",
      medications: medications.map((m: any) => ({
        medicine: m.medicine?.trim() || "Medication",
        dosage: m.dosage?.trim() || "Standard dose",
        frequency: m.frequency?.trim() || "Daily",
        duration: m.duration?.trim() || "7 days",
        instructions: m.instructions?.trim() || "Take as directed",
        refillsRemaining: Number(m.refillsRemaining) || 0,
      })),
      notes: notes || `Created by ${session.doctor.name} on ${new Date().toLocaleDateString()}`,
    });

    return NextResponse.json({
      success: true,
      message: "Prescription successfully submitted and available to Pharmacy.",
      prescription: {
        _id: prescription._id.toString(),
        status: prescription.status,
        date: prescription.date,
        medicationsCount: prescription.medications.length,
      },
    });
  } catch (error: any) {
    console.error("Doctor prescription POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create prescription" },
      { status: 500 }
    );
  }
}
