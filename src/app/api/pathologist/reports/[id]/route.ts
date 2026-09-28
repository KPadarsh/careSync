import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePathologistSession } from "@/lib/auth";
import { LabReport, LabSample, Patient, Doctor, Notification, User } from "@/models";

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
        select: "mrn dateOfBirth gender bloodGroup phone address medicalHistory allergies",
        populate: { path: "userId", select: "name email avatar phone" },
      })
      .populate("doctorId", "name specialty department phone email")
      .populate("sampleDocId")
      .lean();

    if (!report) {
      return NextResponse.json({ error: "Lab report not found." }, { status: 404 });
    }

    const patientDoc = report.patientId as any;
    const patientUser = patientDoc?.userId as any;
    const sampleDoc = report.sampleDocId as any;

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
        underReviewAt: report.underReviewAt,
        underReviewBy: report.underReviewBy,
        correctionRequestedAt: report.correctionRequestedAt,
        correctionReason: report.correctionReason,
        verifiedDate: report.verifiedDate,
        verifiedAt: report.verifiedAt,
        verifiedBy: report.verifiedBy,
        pathologistInterpretation: report.pathologistInterpretation || "",
        pathologistComments: report.pathologistComments || "",
        pathologistNotes: report.pathologistNotes || "",
        revisionHistory: report.revisionHistory || [],
        results: report.results || [],
        sample: {
          sampleId: report.sampleId || sampleDoc?.sampleId || "SMP-N/A",
          sampleType: report.sampleType || sampleDoc?.specimenType || "Blood",
          tubeType: report.tubeType || sampleDoc?.tubeType || "Standard Vacutainer",
          barcode: report.barcode || sampleDoc?.barcode || "N/A",
          barcodeToken: sampleDoc?.barcodeToken || "N/A",
          collectionSite: sampleDoc?.collectionSite || "Phlebotomy Station",
          storageLocation: sampleDoc?.storageLocation || "Laboratory Ambient",
          volume: sampleDoc?.volume || "4.0 mL",
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
        role: session.user.role,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist report detail error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve lab report details." },
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

    // STRICT PERMISSION AUDIT
    // Pathologist cannot edit doctor prescriptions, dispense medication, or perform billing
    if (body.prescription || body.prescriptions || body.medication || body.billing || body.invoice) {
      return NextResponse.json(
        {
          error:
            "Permission Denied: Pathologists cannot alter doctor prescriptions, dispense medication, or perform billing.",
        },
        { status: 403 }
      );
    }

    const report = await LabReport.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Lab report not found." }, { status: 404 });
    }

    // Guard against silently modifying finalized reports
    if (
      (report.status === "verified" || report.status === "finalized") &&
      body.action !== "amend_report"
    ) {
      return NextResponse.json(
        {
          error:
            "Report is already verified and locked. Use the explicit amendment workflow to issue a clinical revision.",
        },
        { status: 400 }
      );
    }

    const action = body.action;

    // 1. Mark Under Review
    if (action === "mark_under_review") {
      report.status = "under_review";
      report.underReviewAt = new Date();
      report.underReviewBy = session.user.name;
      if (body.notes) report.pathologistNotes = body.notes;
      await report.save();

      return NextResponse.json({
        success: true,
        message: `Report marked under active clinical review by ${session.user.name}.`,
        status: report.status,
      });
    }

    // 2. Save Draft Interpretation / Notes
    if (action === "save_draft") {
      if (body.interpretation !== undefined) {
        report.pathologistInterpretation = body.interpretation.trim();
      }
      if (body.comments !== undefined) {
        report.pathologistComments = body.comments.trim();
      }
      if (body.notes !== undefined) {
        report.pathologistNotes = body.notes.trim();
      }
      await report.save();

      return NextResponse.json({
        success: true,
        message: "Draft interpretation and clinical comments saved.",
        status: report.status,
      });
    }

    // 3. Request Correction (Back to Lab Tech)
    if (action === "request_correction") {
      const reason = body.correctionReason?.trim();
      if (!reason) {
        return NextResponse.json(
          { error: "A detailed clinical reason is required when requesting a correction." },
          { status: 400 }
        );
      }

      report.status = "correction_required";
      report.correctionRequestedAt = new Date();
      report.correctionReason = reason;
      if (body.notes) report.pathologistNotes = body.notes.trim();
      await report.save();

      // Dispatch alert to Lab Technician
      try {
        const labTechUser = await User.findOne({ role: "lab_technician" });
        if (labTechUser) {
          await Notification.create({
            recipientId: labTechUser._id,
            type: "lab_report",
            title: `Correction Requested: ${report.testName}`,
            message: `Pathologist ${session.user.name} flagged report for correction: "${reason}". Specimen redraw or wet-bench rerun required.`,
            isRead: false,
            link: `/lab/requests/${report._id}`,
          });
        }
      } catch (e) {
        console.error("Failed to notify lab technician of correction:", e);
      }

      return NextResponse.json({
        success: true,
        message: "Correction request dispatched to laboratory technician.",
        status: report.status,
      });
    }

    // 4. Verify & Finalize Report
    if (action === "verify_and_finalize") {
      const interpretation = body.interpretation?.trim();
      if (!interpretation) {
        return NextResponse.json(
          {
            error:
              "Pathologist clinical diagnostic interpretation is required before final report certification.",
          },
          { status: 400 }
        );
      }

      report.status = "verified";
      report.verifiedAt = new Date();
      report.verifiedDate = new Date();
      report.verifiedBy = `${session.user.name}, MD (Board Certified Pathologist)`;
      report.pathologistInterpretation = interpretation;
      if (body.comments) report.pathologistComments = body.comments.trim();
      if (body.notes) report.pathologistNotes = body.notes.trim();

      // Update sample status to completed
      if (report.sampleDocId) {
        try {
          await LabSample.findByIdAndUpdate(report.sampleDocId, {
            status: "archived",
          });
        } catch (e) {
          console.error("Failed to update sample status:", e);
        }
      }

      await report.save();

      // Notify ordering doctor
      try {
        const doctorDoc = await Doctor.findById(report.doctorId);
        if (doctorDoc?.userId) {
          await Notification.create({
            recipientId: doctorDoc.userId,
            type: "lab_report",
            title: `Certified Lab Results: ${report.testName}`,
            message: `Diagnostic report for your patient has been certified and finalized by Pathologist ${session.user.name}.`,
            isRead: false,
            link: `/doctor/lab/${report._id}`,
          });
        }
      } catch (e) {
        console.error("Failed to notify ordering doctor:", e);
      }

      // Notify patient
      try {
        const patientDoc = await Patient.findById(report.patientId);
        if (patientDoc?.userId) {
          await Notification.create({
            recipientId: patientDoc.userId,
            type: "lab_report",
            title: `Diagnostic Report Available: ${report.testName}`,
            message: `Your laboratory results have been clinically certified by Pathology and are now available for review.`,
            isRead: false,
            link: `/patient/lab-reports`,
          });
        }
      } catch (e) {
        console.error("Failed to notify patient:", e);
      }

      return NextResponse.json({
        success: true,
        message: "Diagnostic lab report successfully certified and finalized.",
        status: report.status,
        verifiedBy: report.verifiedBy,
        verifiedAt: report.verifiedAt,
      });
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist report review POST error:", error);
    return NextResponse.json(
      { error: "Failed to process pathology review action." },
      { status: 500 }
    );
  }
}
