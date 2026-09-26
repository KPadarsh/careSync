import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import { LabReport, Patient, Doctor } from "@/models";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireDoctorSession();

    const { id } = await context.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Valid Lab Report ID is required" },
        { status: 400 }
      );
    }

    const report = await LabReport.findById(id)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth phone allergies emergencyContact",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber")
      .lean();

    if (!report) {
      return NextResponse.json(
        { error: "Lab report not found" },
        { status: 404 }
      );
    }

    const patient = report.patientId as any;
    const patientName =
      patient?.userId?.name ||
      `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() ||
      "Patient";

    const age = patient?.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(patient.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 32;

    return NextResponse.json({
      report: {
        _id: report._id.toString(),
        testName: report.testName,
        department: report.department || "Clinical Pathology",
        sampleCollectionDate: report.sampleCollectionDate,
        verifiedDate: report.verifiedDate,
        status: report.status,
        summary: report.summary,
        verifiedBy: report.verifiedBy || "Dr. Sunita Patil, MD Pathology",
        results: report.results || [],
        fileUrl: report.fileUrl,
        patient: {
          _id: patient?._id?.toString(),
          name: patientName,
          mrn: patient?.mrn || "MRN-N/A",
          age,
          gender: patient?.gender || "male",
          bloodGroup: patient?.bloodGroup || "O+",
          allergies: patient?.allergies || [],
          avatar: patient?.userId?.avatar,
        },
        doctor: {
          name: (report.doctorId as any)?.name || "Ordering Physician",
          specialty: (report.doctorId as any)?.specialty || "Medicine",
          roomNumber: (report.doctorId as any)?.roomNumber,
        },
      },
    });
  } catch (error: any) {
    console.error("Doctor lab report detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load lab report" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // STRICT RBAC CHECK: Doctor cannot verify pathology reports
  return NextResponse.json(
    {
      error:
        "PERMISSIONS_VIOLATION: Doctors cannot verify pathology reports. Only certified Pathologists are authorized to sign and verify laboratory diagnostics.",
    },
    { status: 403 }
  );
}
