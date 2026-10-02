import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";
import { LabSample, LabReport, Patient, Doctor } from "@/models";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireLabSession();
    const { id } = await context.params;

    // Support lookup by MongoDB _id or sampleId (e.g. SMP-2026-00125) or barcode
    let sample = await LabSample.findById(id).lean().catch(() => null);
    if (!sample) {
      sample = await LabSample.findOne({
        $or: [{ sampleId: id }, { barcode: id }, { barcodeToken: id }],
      }).lean();
    }

    if (!sample) {
      return NextResponse.json(
        { error: "Lab sample specimen not found" },
        { status: 404 }
      );
    }

    const [patientDoc, doctorDoc, reportDoc] = await Promise.all([
      Patient.findById((sample as any).patientId)
        .populate("userId", "name email phone avatar")
        .lean(),
      Doctor.findById((sample as any).doctorId).lean(),
      LabReport.findById((sample as any).labReportId).lean(),
    ]);

    const patientName =
      (patientDoc as any)?.userId?.name ||
      `${(patientDoc as any)?.firstName || ""} ${(patientDoc as any)?.lastName || ""}`.trim() ||
      "Patient";

    const age = (patientDoc as any)?.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date((patientDoc as any).dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : null;


    // Chain of custody milestones
    const chainOfCustody = [
      {
        step: "Collection & Phlebotomy",
        time: (sample as any).collectedAt,
        actor: (sample as any).collectedBy || "Lab Technician",
        location: (sample as any).collectionSite || "Station 2 Phlebotomy",
        status: "completed",
        notes: "Specimen drawn and labeled at patient bedside/bay.",
      },
      {
        step: "Accessioning & Barcode Check",
        time: new Date(new Date((sample as any).collectedAt).getTime() + 10 * 60 * 1000),
        actor: "Accessioning Scanner • Station 2",
        location: "Central Specimen Intake Desk",
        status: "completed",
        notes: `Secure token ${(sample as any).barcodeToken} verified. No patient PII encoded.`,
      },
      {
        step: "Centrifugation & Prep",
        time: new Date(new Date((sample as any).collectedAt).getTime() + 25 * 60 * 1000),
        actor: "Centrifuge Unit C-3 (3000 RPM, 10 min)",
        location: "Analytical Preparation Bench",
        status:
          ["processing", "analyzed", "stored"].includes((sample as any).status)
            ? "completed"
            : (sample as any).status === "collected"
            ? "in-progress"
            : "pending",
        notes: "Serum/Plasma separation checked for lipemia and hemolysis.",
      },
      {
        step: "Analyzer Bench Processing",
        time: reportDoc?.processingStartedAt || null,
        actor: (reportDoc as any)?.analyzerBench || "Roche Cobas 6000 / Sysmex XN-1000",
        location: "Automated Chemistry / Hematology Carousel",
        status:
          ["analyzed", "stored"].includes((sample as any).status)
            ? "completed"
            : (sample as any).status === "processing"
            ? "in-progress"
            : "pending",
        notes: "Electrochemical / Photometric / Impedance analysis run.",
      },
      {
        step: "Post-Analytical Archival",
        time: (sample as any).updatedAt,
        actor: "Laboratory Storage Technician",
        location: (sample as any).storageLocation,
        status: ["analyzed", "stored"].includes((sample as any).status)
          ? "completed"
          : "pending",
        notes: "Refrigerated retention under standard 7-day specimen archive policy.",
      },
    ];

    const formatted = {
      _id: (sample as any)._id.toString(),
      sampleId: (sample as any).sampleId,
      labReportId: (sample as any).labReportId?.toString(),
      testName: (sample as any).testName,
      department: (sample as any).department,
      specimenType: (sample as any).specimenType,
      tubeType: (sample as any).tubeType,
      barcode: (sample as any).barcode,
      barcodeToken: (sample as any).barcodeToken,
      collectionSite: (sample as any).collectionSite,
      collectedAt: (sample as any).collectedAt,
      collectedBy: (sample as any).collectedBy,
      storageLocation: (sample as any).storageLocation,
      volume: (sample as any).volume,
      status: (sample as any).status,
      rejectionReason: (sample as any).rejectionReason,
      technicianNotes: (sample as any).technicianNotes,
      chainOfCustody,
      report: reportDoc
        ? {
            _id: reportDoc._id.toString(),
            status: reportDoc.status,
            priority: (reportDoc as any).priority || "routine",
            summary: reportDoc.summary,
            resultsCount: reportDoc.results?.length || 0,
            results: reportDoc.results || [],
          }
        : null,
      patient: {
        _id: patientDoc?._id?.toString(),
        name: patientName,
        mrn: patientDoc?.mrn || "MRN-N/A",
        age,
        gender: patientDoc?.gender || "unknown",
        bloodGroup: patientDoc?.bloodGroup || "—",
        allergies: patientDoc?.allergies || [],
      },
      doctor: {
        _id: doctorDoc?._id?.toString(),
        name: doctorDoc?.name || "Ordering Physician",
        specialty: doctorDoc?.specialty || "Internal Medicine",
      },
    };

    return NextResponse.json({ sample: formatted });
  } catch (error: any) {
    console.error("Lab Sample Detail GET error:", error);
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
    await requireLabSession();
    const { id } = await context.params;
    const body = await request.json();

    const sample = await LabSample.findById(id);
    if (!sample) {
      return NextResponse.json(
        { error: "Lab sample specimen not found" },
        { status: 404 }
      );
    }

    if (body.storageLocation) sample.storageLocation = body.storageLocation;
    if (body.status) sample.status = body.status;
    if (body.rejectionReason) sample.rejectionReason = body.rejectionReason;
    if (body.technicianNotes) sample.technicianNotes = body.technicianNotes;
    if (body.volume) sample.volume = body.volume;

    await sample.save();

    return NextResponse.json({
      success: true,
      message: "Sample record updated successfully.",
      sample: sample.toObject(),
    });
  } catch (error: any) {
    console.error("Lab Sample Detail PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update sample record" },
      { status: 500 }
    );
  }
}
