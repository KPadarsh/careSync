import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession } from "@/lib/auth";
import { LabReport, LabSample, Patient, Doctor } from "@/models";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireLabTechSession();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const report = await LabReport.findById(id)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup phone allergies emergencyContact",
        populate: { path: "userId", select: "name email avatar phone" },
      })
      .populate("doctorId", "name specialty department roomNumber")
      .populate("sampleId")
      .lean();

    if (!report) {
      return NextResponse.json({ error: "Lab request not found" }, { status: 404 });
    }

    const patientName =
      (report.patientId as any)?.userId?.name ||
      `${(report.patientId as any)?.firstName || ""} ${(report.patientId as any)?.lastName || ""}`.trim() ||
      "Patient";

    const age = (report.patientId as any)?.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date((report.patientId as any).dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 34;

    return NextResponse.json({
      request: {
        _id: report._id.toString(),
        testName: report.testName,
        department: report.department,
        priority: report.priority || "routine",
        status: report.status,
        clinicalReason: report.clinicalReason || "Diagnostic evaluation",
        instructions: report.instructions || "Standard diagnostic protocol",
        sampleCollectionDate: report.sampleCollectionDate,
        summary: report.summary,
        technicianNotes: report.technicianNotes || "",
        createdAt: report.createdAt,
        patient: {
          _id: (report.patientId as any)?._id?.toString(),
          name: patientName,
          mrn: (report.patientId as any)?.mrn || "MRN-N/A",
          age,
          gender: (report.patientId as any)?.gender || "male",
          bloodGroup: (report.patientId as any)?.bloodGroup || "O+",
          phone: (report.patientId as any)?.phone || "N/A",
          allergies: (report.patientId as any)?.allergies || [],
        },
        doctor: {
          name: (report.doctorId as any)?.name || "Attending Physician",
          specialty: (report.doctorId as any)?.specialty || "General Medicine",
          department: (report.doctorId as any)?.department || "Cardiology",
          room: (report.doctorId as any)?.roomNumber || "Room 302",
        },
        sample: report.sampleId
          ? {
              _id: (report.sampleId as any)._id.toString(),
              sampleId: (report.sampleId as any).sampleId,
              barcode: (report.sampleId as any).barcode,
              sampleType: (report.sampleId as any).sampleType,
              containerType: (report.sampleId as any).containerType,
              collectionVolume: (report.sampleId as any).collectionVolume,
              collectedBy: (report.sampleId as any).collectedBy,
              collectedAt: (report.sampleId as any).collectedAt,
              status: (report.sampleId as any).status,
              storageLocation: (report.sampleId as any).storageLocation,
              notes: (report.sampleId as any).notes,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("Lab request GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load lab request detail" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireLabTechSession();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const report = await LabReport.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Lab request not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, sampleType, containerType, collectionVolume, storageLocation, notes } = body;

    if (action === "collect-sample") {
      // Generate sample ID: SMP-2026-XXXXX
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const sampleId = `SMP-2026-${randomNum}`;
      // Secure Barcode identifier without encoding PHI
      const barcode = `BC-9812-${randomNum}`;

      const sample = await LabSample.create({
        sampleId,
        barcode,
        patientId: report.patientId,
        labReportId: report._id,
        testName: report.testName,
        sampleType: sampleType || "Venous Blood",
        containerType: containerType || "EDTA Tube (Purple Top)",
        collectionVolume: collectionVolume || "4 mL",
        collectedBy: session.user.name,
        collectedAt: new Date(),
        status: "collected",
        storageLocation: storageLocation || "Rack A-1, Main Refrigerator (4°C)",
        notes: notes || "Sample drawn via venipuncture in Phlebotomy Room.",
      });

      report.sampleId = sample._id as any;
      report.sampleCode = sample.sampleId;
      report.status = "sample-collected";
      report.sampleCollectionDate = new Date();
      report.summary = `Sample ${sample.sampleId} collected by ${session.user.name}. Storage: ${sample.storageLocation}.`;
      await report.save();

      return NextResponse.json({
        success: true,
        message: `Sample ${sample.sampleId} successfully collected and registered.`,
        sample: {
          sampleId: sample.sampleId,
          barcode: sample.barcode,
          status: sample.status,
          storageLocation: sample.storageLocation,
        },
        status: report.status,
      });
    }

    if (action === "start-processing") {
      report.status = "processing";
      report.summary = `Mounted on analyzer by ${session.user.name}. Testing run initiated.`;
      await report.save();

      if (report.sampleId) {
        await LabSample.findByIdAndUpdate(report.sampleId, { status: "processing" });
      }

      return NextResponse.json({
        success: true,
        message: "Diagnostic run initiated on analyzer. Status transitioned to Processing.",
        status: report.status,
      });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("Lab request action POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process lab request action" },
      { status: 500 }
    );
  }
}
