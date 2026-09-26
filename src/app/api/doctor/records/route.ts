import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import { MedicalRecord, Visit, Patient, Doctor } from "@/models";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireDoctorSession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const category = searchParams.get("category"); // all, consultation, clinical-note, discharge-summary

    let query: any = {};
    if (category && category !== "all") {
      query.category = category;
    }

    const records = await MedicalRecord.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth allergies phone",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty qualification")
      .sort({ recordDate: -1 })
      .lean();

    const formatted = records
      .map((r: any) => {
        const patientName =
          r.patientId?.userId?.name ||
          `${r.patientId?.firstName || ""} ${r.patientId?.lastName || ""}`.trim() ||
          "Patient";

        const age = r.patientId?.dateOfBirth
          ? Math.floor(
              (Date.now() - new Date(r.patientId.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 32;

        return {
          _id: r._id.toString(),
          title: r.title,
          category: r.category,
          recordDate: r.recordDate,
          facility: r.facility || "CareSync Central Clinic",
          summary: r.summary,
          fileUrl: r.fileUrl,
          isStaffOnly: r.isStaffOnly,
          doctor: {
            name: r.doctorId?.name || "Consulting Physician",
            specialty: r.doctorId?.specialty || "General Medicine",
          },
          patient: {
            _id: r.patientId?._id?.toString(),
            name: patientName,
            mrn: r.patientId?.mrn || "MRN-N/A",
            age,
            gender: r.patientId?.gender || "male",
            bloodGroup: r.patientId?.bloodGroup || "O+",
            allergies: r.patientId?.allergies || [],
            avatar: r.patientId?.userId?.avatar,
          },
        };
      })
      .filter((r) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          r.patient.name.toLowerCase().includes(s) ||
          r.patient.mrn.toLowerCase().includes(s) ||
          r.title.toLowerCase().includes(s) ||
          r.summary.toLowerCase().includes(s)
        );
      });

    return NextResponse.json({
      records: formatted,
      totalCount: formatted.length,
    });
  } catch (error: any) {
    console.error("Doctor medical records GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load medical records" },
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

    const { recordId, addendumNote, reasonForRevision } = body;

    // IMMUTABILITY CONSTRAINT: Finalized records must not be silently overwritten.
    // Use explicit correction/revision addendum workflow.
    if (!recordId || !addendumNote) {
      return NextResponse.json(
        { error: "Record ID and Addendum Note are required for clinical revisions" },
        { status: 400 }
      );
    }

    const existingRecord = await MedicalRecord.findById(recordId);
    if (!existingRecord) {
      return NextResponse.json(
        { error: "Medical record not found" },
        { status: 404 }
      );
    }

    const revisionTimestamp = new Date().toLocaleString();
    const revisionHeader = `\n\n[CLINICAL ADDENDUM - ${revisionTimestamp} by ${session.doctor.name} (${session.doctor.qualification})]:\nReason for Revision: ${reasonForRevision || "Supplemental clinical notes"}\nAddendum: ${addendumNote.trim()}`;

    existingRecord.summary += revisionHeader;
    await existingRecord.save();

    return NextResponse.json({
      success: true,
      message: "Explicit clinical addendum committed. Finalized record preserved with audit trail.",
      record: {
        _id: existingRecord._id.toString(),
        summary: existingRecord.summary,
        updatedAt: existingRecord.updatedAt,
      },
    });
  } catch (error: any) {
    console.error("Doctor record addendum error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to append clinical addendum" },
      { status: 500 }
    );
  }
}
