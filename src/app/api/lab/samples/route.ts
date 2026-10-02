import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";
import { LabSample, LabReport, Patient, Doctor } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabSession();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status")?.toLowerCase() || "all";
    const typeFilter = searchParams.get("type")?.toLowerCase() || "all";
    const search = searchParams.get("search")?.trim().toLowerCase();

    const query: any = {};

    if (statusFilter && statusFilter !== "all") {
      query.status = statusFilter;
    }

    if (typeFilter && typeFilter !== "all") {
      query.specimenType = { $regex: new RegExp(typeFilter, "i") };
    }

    const samples = await LabSample.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup",
        populate: { path: "userId", select: "name avatar" },
      })
      .populate("doctorId", "name specialty")
      .populate("labReportId", "status priority summary results")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = samples
      .map((s: any) => {
        const patientName =
          s.patientId?.userId?.name ||
          `${s.patientId?.firstName || ""} ${s.patientId?.lastName || ""}`.trim() ||
          "Patient";

        const age = s.patientId?.dateOfBirth
          ? Math.floor(
              (Date.now() - new Date(s.patientId.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 35;

        return {
          _id: s._id.toString(),
          sampleId: s.sampleId,
          labReportId: s.labReportId?._id?.toString() || s.labReportId?.toString(),
          testName: s.testName,
          department: s.department,
          specimenType: s.specimenType,
          tubeType: s.tubeType,
          barcode: s.barcode,
          barcodeToken: s.barcodeToken,
          collectionSite: s.collectionSite,
          collectedAt: s.collectedAt,
          collectedBy: s.collectedBy,
          storageLocation: s.storageLocation,
          volume: s.volume,
          status: s.status,
          rejectionReason: s.rejectionReason,
          technicianNotes: s.technicianNotes,
          requestStatus: s.labReportId?.status || "sample_collected",
          priority: s.labReportId?.priority || "routine",
          patient: {
            _id: s.patientId?._id?.toString(),
            name: patientName,
            mrn: s.patientId?.mrn || "MRN-N/A",
            age,
            gender: s.patientId?.gender || "unknown",
            bloodGroup: s.patientId?.bloodGroup || "—",
            avatar: s.patientId?.userId?.avatar,
          },
          doctor: {
            _id: s.doctorId?._id?.toString(),
            name: s.doctorId?.name || "Ordering Physician",
            specialty: s.doctorId?.specialty || "Internal Medicine",
          },
        };
      })
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.sampleId.toLowerCase().includes(q) ||
          s.barcode.toLowerCase().includes(q) ||
          s.barcodeToken.toLowerCase().includes(q) ||
          s.testName.toLowerCase().includes(q) ||
          s.patient.name.toLowerCase().includes(q) ||
          s.patient.mrn.toLowerCase().includes(q) ||
          s.storageLocation.toLowerCase().includes(q)
        );
      });

    return NextResponse.json({ samples: formatted });
  } catch (error: any) {
    console.error("Lab Samples GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load laboratory samples" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireLabSession();
    const technicianName = session.user.name || "Lab Technician";
    const body = await request.json();

    const {
      labReportId,
      specimenType = "Venous Blood",
      tubeType = "Lavender Top (EDTA)",
      collectionSite = "Central Phlebotomy Station 2",
      storageLocation = "Rack A-01 / Ambient",
      volume = "4.0 mL",
      technicianNotes,
    } = body;

    if (!labReportId) {
      return NextResponse.json(
        { error: "Lab Report ID is required to accession a sample" },
        { status: 400 }
      );
    }

    const report = await LabReport.findById(labReportId);
    if (!report) {
      return NextResponse.json(
        { error: "Linked lab requisition not found" },
        { status: 404 }
      );
    }

    // Generate sample ID
    const count = await LabSample.countDocuments();
    const seq = (count + 130).toString().padStart(5, "0");
    const sampleId = `SMP-2026-${seq}`;

    // Generate safe non-PII barcode
    const randomToken = Math.random().toString(36).substring(2, 6).toUpperCase();
    const barcode = `CS-${sampleId}-${randomToken}`;
    const barcodeToken = `${sampleId}-${randomToken}`;

    const newSample = await LabSample.create({
      sampleId,
      labReportId: report._id,
      patientId: report.patientId,
      doctorId: report.doctorId,
      testName: report.testName,
      department: report.department,
      specimenType,
      tubeType,
      barcode,
      barcodeToken,
      collectionSite,
      collectedAt: new Date(),
      collectedBy: technicianName,
      storageLocation,
      volume,
      status: "collected",
      technicianNotes: technicianNotes || `Accessioned by ${technicianName}`,
    });

    report.status = "sample_collected";
    (report as any).sampleId = sampleId;
    (report as any).sampleDocId = newSample._id as any;
    (report as any).sampleType = specimenType;
    (report as any).tubeType = tubeType;
    (report as any).barcode = barcode;
    (report as any).sampleCollectedAt = new Date();
    (report as any).sampleCollectedBy = technicianName;
    await report.save();

    return NextResponse.json({
      success: true,
      sample: newSample.toObject(),
      message: `Sample ${sampleId} successfully accessioned and barcode generated.`,
    });
  } catch (error: any) {
    console.error("Lab Samples POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accession sample" },
      { status: 500 }
    );
  }
}
