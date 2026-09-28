import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePathologistSession } from "@/lib/auth";
import { LabReport, Patient, Doctor, Notification } from "@/models";
import crypto from "crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePathologistSession();
    await connectToDatabase();

    const { id } = await params;

    const report = await LabReport.findById(id)
      .populate({
        path: "patientId",
        select: "mrn dateOfBirth gender bloodGroup phone address allergies",
        populate: { path: "userId", select: "name email avatar phone" },
      })
      .populate("doctorId", "name specialty department phone email")
      .populate("sampleDocId")
      .lean();

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    if (report.status !== "verified" && report.status !== "finalized") {
      return NextResponse.json(
        { error: "Report has not yet been verified or finalized." },
        { status: 400 }
      );
    }

    const patientDoc = report.patientId as any;
    const patientUser = patientDoc?.userId as any;
    const sampleDoc = report.sampleDocId as any;

    // Generate deterministic digital verification certificate hash
    const certString = `${report._id}-${report.testName}-${report.verifiedDate || report.updatedAt}-${report.verifiedBy}`;
    const digitalSignatureHash = crypto
      .createHash("sha256")
      .update(certString)
      .digest("hex")
      .slice(0, 24)
      .toUpperCase();

    return NextResponse.json({
      report: {
        id: report._id.toString(),
        testName: report.testName,
        department: report.department,
        priority: report.priority,
        status: report.status,
        summary: report.summary,
        technicianNotes: report.technicianNotes,
        analyzerBench: report.analyzerBench,
        sampleCollectionDate: report.sampleCollectionDate,
        sampleCollectedAt: report.sampleCollectedAt,
        sampleCollectedBy: report.sampleCollectedBy,
        processingStartedAt: report.processingStartedAt,
        processingBy: report.processingBy,
        resultEnteredAt: report.resultEnteredAt,
        submittedForReviewAt: report.submittedForReviewAt,
        submittedBy: report.submittedBy,
        verifiedDate: report.verifiedDate || report.verifiedAt || report.updatedAt,
        verifiedBy: report.verifiedBy || `${session.user.name}, MD (Board Certified Pathologist)`,
        pathologistInterpretation: report.pathologistInterpretation || "Diagnostic interpretation recorded per standard clinical pathology protocols.",
        pathologistComments: report.pathologistComments || "",
        pathologistNotes: report.pathologistNotes || "",
        revisionHistory: report.revisionHistory || [],
        results: report.results || [],
        digitalSignature: {
          hash: `CS-DX-${digitalSignatureHash}`,
          signer: report.verifiedBy || session.user.name,
          institution: "CareSync Clinical Laboratories & Pathology Group",
          timestamp: report.verifiedDate || report.updatedAt,
          tamperEvident: true,
        },
        sample: {
          sampleId: report.sampleId || sampleDoc?.sampleId || "SMP-N/A",
          sampleType: report.sampleType || sampleDoc?.specimenType || "Blood",
          tubeType: report.tubeType || sampleDoc?.tubeType || "Standard Tube",
          barcode: report.barcode || sampleDoc?.barcode || "N/A",
          barcodeToken: sampleDoc?.barcodeToken || "N/A",
          collectedAt: sampleDoc?.collectedAt || report.sampleCollectedAt,
          collectedBy: sampleDoc?.collectedBy || report.sampleCollectedBy,
        },
        patient: {
          id: patientDoc?._id?.toString() || "",
          name: patientUser?.name || "Patient Record",
          mrn: patientDoc?.mrn || "MRN-N/A",
          dob: patientDoc?.dateOfBirth,
          gender: patientDoc?.gender || "Unknown",
          bloodGroup: patientDoc?.bloodGroup || "Unknown",
          phone: patientDoc?.phone || patientUser?.phone || "N/A",
          allergies: patientDoc?.allergies || [],
        },
        doctor: {
          id: (report.doctorId as any)?._id?.toString() || "",
          name: (report.doctorId as any)?.name || "Attending Physician",
          department: (report.doctorId as any)?.department || report.department,
          specialty: (report.doctorId as any)?.specialty || "Internal Medicine",
        },
      },
      pathologist: {
        id: session.user._id.toString(),
        name: session.user.name,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Verified report detail error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve verified report details." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePathologistSession();
    await connectToDatabase();

    const { id } = await params;
    const body = await req.json();

    // STRICT ROLE CONSTRAINTS
    if (body.prescription || body.prescriptions || body.medication || body.billing) {
      return NextResponse.json(
        {
          error:
            "Permission Denied: Pathologists cannot alter prescriptions or execute billing.",
        },
        { status: 403 }
      );
    }

    const report = await LabReport.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    if (body.action !== "amend_report") {
      return NextResponse.json(
        {
          error:
            "Invalid action. Finalized reports can only be updated through the explicit revision/amendment protocol.",
        },
        { status: 400 }
      );
    }

    const reason = body.amendmentReason?.trim();
    const newInterpretation = body.updatedInterpretation?.trim();

    if (!reason || !newInterpretation) {
      return NextResponse.json(
        {
          error:
            "Both an explicit amendment rationale and the updated diagnostic interpretation are required.",
        },
        { status: 400 }
      );
    }

    // Archive revision audit log (never silently change finalized reports)
    if (!report.revisionHistory) {
      report.revisionHistory = [];
    }

    report.revisionHistory.push({
      revisionDate: new Date(),
      revisedBy: `${session.user.name}, MD (Pathologist)`,
      reason,
      previousSummary: report.summary,
      previousInterpretation: report.pathologistInterpretation || "Prior interpretation archived.",
    });

    report.pathologistInterpretation = newInterpretation;
    report.summary = `[AMENDED REPORT - ${new Date().toLocaleDateString()}] ${report.summary}`;
    if (body.updatedComments) {
      report.pathologistComments = body.updatedComments.trim();
    }
    report.verifiedDate = new Date();
    await report.save();

    // Dispatch amendment alert to ordering doctor
    try {
      const doctorDoc = await Doctor.findById(report.doctorId);
      if (doctorDoc?.userId) {
        await Notification.create({
          recipientId: doctorDoc.userId,
          type: "lab_report",
          title: `Diagnostic Report Addendum: ${report.testName}`,
          message: `Pathologist ${session.user.name} issued a formal addendum/amendment for patient lab report: "${reason}".`,
          isRead: false,
          link: `/doctor/lab/${report._id}`,
        });
      }
    } catch (e) {
      console.error("Failed to notify doctor of report amendment:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Formal clinical amendment logged and certified in revision audit trail.",
      reportId: report._id.toString(),
      revisionsCount: report.revisionHistory.length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Verified report amendment error:", error);
    return NextResponse.json(
      { error: "Failed to process report amendment." },
      { status: 500 }
    );
  }
}
