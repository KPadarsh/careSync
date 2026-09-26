import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession } from "@/lib/auth";
import { LabSample, Patient, LabReport } from "@/models";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireLabTechSession();
    const { id } = await context.params;

    let sample: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      sample = await LabSample.findById(id);
    }
    if (!sample) {
      sample = await LabSample.findOne({
        $or: [{ sampleId: id }, { barcode: id }],
      });
    }

    if (!sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    await sample.populate({
      path: "patientId",
      select: "firstName lastName mrn dateOfBirth gender bloodGroup phone allergies",
      populate: { path: "userId", select: "name email avatar" },
    });
    await sample.populate({
      path: "labReportId",
      select: "testName department priority clinicalReason instructions status doctorId",
      populate: { path: "doctorId", select: "name specialty department" },
    });

    const patientName =
      sample.patientId?.userId?.name ||
      `${sample.patientId?.firstName || ""} ${sample.patientId?.lastName || ""}`.trim() ||
      "Patient";

    const age = sample.patientId?.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(sample.patientId.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 34;

    return NextResponse.json({
      sample: {
        _id: sample._id.toString(),
        sampleId: sample.sampleId,
        barcode: sample.barcode,
        testName: sample.testName,
        sampleType: sample.sampleType,
        containerType: sample.containerType,
        collectionVolume: sample.collectionVolume,
        collectedBy: sample.collectedBy,
        collectedAt: sample.collectedAt,
        status: sample.status,
        storageLocation: sample.storageLocation,
        notes: sample.notes,
        patient: {
          _id: sample.patientId?._id?.toString(),
          name: patientName,
          mrn: sample.patientId?.mrn || "MRN-N/A",
          age,
          gender: sample.patientId?.gender || "male",
          bloodGroup: sample.patientId?.bloodGroup || "O+",
          phone: sample.patientId?.phone || "N/A",
          allergies: sample.patientId?.allergies || [],
        },
        report: sample.labReportId
          ? {
              _id: sample.labReportId._id.toString(),
              testName: sample.labReportId.testName,
              department: sample.labReportId.department,
              priority: sample.labReportId.priority,
              status: sample.labReportId.status,
              doctorName: sample.labReportId.doctorId?.name || "Attending Physician",
              doctorSpecialty: sample.labReportId.doctorId?.specialty || "General Medicine",
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Lab sample detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load sample detail" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireLabTechSession();
    const { id } = await context.params;

    let sample = await LabSample.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null },
        { sampleId: id },
        { barcode: id },
      ],
    });

    if (!sample) {
      return NextResponse.json({ error: "Sample not found" }, { status: 404 });
    }

    const body = await request.json();
    const { status, storageLocation, notes } = body;

    if (status) sample.status = status;
    if (storageLocation) sample.storageLocation = storageLocation.trim();
    if (notes !== undefined) sample.notes = notes.trim();

    await sample.save();

    return NextResponse.json({
      success: true,
      message: "Sample tracking and location updated successfully.",
      sample: {
        _id: sample._id.toString(),
        sampleId: sample.sampleId,
        status: sample.status,
        storageLocation: sample.storageLocation,
        notes: sample.notes,
      },
    });
  } catch (error: any) {
    console.error("Lab sample detail PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update sample detail" },
      { status: 500 }
    );
  }
}
