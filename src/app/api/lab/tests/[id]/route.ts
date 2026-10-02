import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";
import { LabReport, LabSample, Patient, Doctor, Notification } from "@/models";
import { NotificationService } from "@/services/notification.service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireLabSession();
    const { id } = await context.params;

    const report = await LabReport.findById(id)
      .populate({
        path: "patientId",
        select:
          "firstName lastName mrn dateOfBirth gender bloodGroup allergies emergencyContact",
        populate: { path: "userId", select: "name avatar" },
      })
      .populate("doctorId", "name specialty department")
      .populate("sampleDocId")
      .lean();

    if (!report) {
      return NextResponse.json(
        { error: "Test workbench record not found" },
        { status: 404 }
      );
    }

    const patientName =
      (report as any).patientId?.userId?.name ||
      `${(report as any).patientId?.firstName || ""} ${(report as any).patientId?.lastName || ""}`.trim() ||
      "Patient";

    const age = (report as any).patientId?.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date((report as any).patientId.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 35;

    // Recommended parameters catalog for quick technician entry if parameters are empty
    const recommendedTemplates: Record<string, any[]> = {
      cbc: [
        { parameter: "White Blood Cells (WBC)", unit: "x10³/µL", referenceRange: "4.5 - 11.0", value: "", flag: "normal" },
        { parameter: "Red Blood Cells (RBC)", unit: "x10⁶/µL", referenceRange: "4.3 - 5.9", value: "", flag: "normal" },
        { parameter: "Hemoglobin (Hgb)", unit: "g/dL", referenceRange: "13.5 - 17.5", value: "", flag: "normal" },
        { parameter: "Hematocrit (Hct)", unit: "%", referenceRange: "38.8 - 50.0", value: "", flag: "normal" },
        { parameter: "Platelet Count", unit: "x10³/µL", referenceRange: "150 - 450", value: "", flag: "normal" },
        { parameter: "Mean Corpuscular Volume (MCV)", unit: "fL", referenceRange: "80.0 - 96.0", value: "", flag: "normal" },
      ],
      cmp: [
        { parameter: "Fasting Blood Glucose", unit: "mg/dL", referenceRange: "70 - 99", value: "", flag: "normal" },
        { parameter: "Blood Urea Nitrogen (BUN)", unit: "mg/dL", referenceRange: "7 - 20", value: "", flag: "normal" },
        { parameter: "Serum Creatinine", unit: "mg/dL", referenceRange: "0.6 - 1.2", value: "", flag: "normal" },
        { parameter: "Estimated GFR", unit: "mL/min/1.73m²", referenceRange: "> 90", value: "", flag: "normal" },
        { parameter: "Sodium", unit: "mEq/L", referenceRange: "136 - 145", value: "", flag: "normal" },
        { parameter: "Potassium", unit: "mEq/L", referenceRange: "3.5 - 5.1", value: "", flag: "normal" },
        { parameter: "Chloride", unit: "mEq/L", referenceRange: "98 - 107", value: "", flag: "normal" },
      ],
      cardiac: [
        { parameter: "High-Sensitivity Troponin I", unit: "ng/L", referenceRange: "< 14 (Female), < 26 (Male)", value: "", flag: "normal" },
        { parameter: "CK-MB Mass", unit: "ng/mL", referenceRange: "0.0 - 5.0", value: "", flag: "normal" },
        { parameter: "Myoglobin", unit: "ng/mL", referenceRange: "28 - 72", value: "", flag: "normal" },
      ],
      lipid: [
        { parameter: "Total Cholesterol", unit: "mg/dL", referenceRange: "< 200 (Desirable)", value: "", flag: "normal" },
        { parameter: "Triglycerides", unit: "mg/dL", referenceRange: "< 150 (Normal)", value: "", flag: "normal" },
        { parameter: "HDL Cholesterol", unit: "mg/dL", referenceRange: "> 40 (Male), > 50 (Female)", value: "", flag: "normal" },
        { parameter: "LDL Cholesterol (Calculated)", unit: "mg/dL", referenceRange: "< 100 (Optimal)", value: "", flag: "normal" },
      ],
      thyroid: [
        { parameter: "Thyroid Stimulating Hormone (TSH)", unit: "µIU/mL", referenceRange: "0.45 - 4.50", value: "", flag: "normal" },
        { parameter: "Free Thyroxine (FT4)", unit: "ng/dL", referenceRange: "0.82 - 1.77", value: "", flag: "normal" },
        { parameter: "Total Triiodothyronine (T3)", unit: "ng/dL", referenceRange: "71 - 180", value: "", flag: "normal" },
      ],
    };

    let matchedTemplate: any[] = [];
    const testLower = report.testName.toLowerCase();
    if (testLower.includes("cbc") || testLower.includes("blood count")) {
      matchedTemplate = recommendedTemplates.cbc;
    } else if (testLower.includes("metabolic") || testLower.includes("cmp") || testLower.includes("renal")) {
      matchedTemplate = recommendedTemplates.cmp;
    } else if (testLower.includes("troponin") || testLower.includes("cardiac")) {
      matchedTemplate = recommendedTemplates.cardiac;
    } else if (testLower.includes("lipid") || testLower.includes("cholesterol")) {
      matchedTemplate = recommendedTemplates.lipid;
    } else if (testLower.includes("thyroid") || testLower.includes("tsh")) {
      matchedTemplate = recommendedTemplates.thyroid;
    } else {
      matchedTemplate = [
        { parameter: `${report.testName} Primary Assay`, unit: "Index", referenceRange: "Normal", value: "", flag: "normal" },
      ];
    }

    const formatted = {
      _id: report._id.toString(),
      testName: report.testName,
      department: report.department,
      priority: (report as any).priority || "routine",
      status: report.status,
      sampleId: (report as any).sampleId,
      sampleType: (report as any).sampleType,
      tubeType: (report as any).tubeType,
      barcode: (report as any).barcode,
      requestedDate: (report as any).createdAt || report.sampleCollectionDate,
      sampleCollectedAt: (report as any).sampleCollectedAt,
      sampleCollectedBy: (report as any).sampleCollectedBy,
      processingStartedAt: (report as any).processingStartedAt,
      processingBy: (report as any).processingBy,
      analyzerBench: (report as any).analyzerBench || "Roche Cobas 6000 Chemistry Analyzer",
      resultEnteredAt: (report as any).resultEnteredAt,
      submittedForReviewAt: (report as any).submittedForReviewAt,
      submittedBy: (report as any).submittedBy,
      summary: report.summary,
      technicianNotes: (report as any).technicianNotes || "",
      results: report.results && report.results.length > 0 ? report.results : matchedTemplate,
      hasSavedResults: !!(report.results && report.results.length > 0),
      patient: {
        _id: (report as any).patientId?._id?.toString(),
        name: patientName,
        mrn: (report as any).patientId?.mrn || "MRN-N/A",
        age,
        gender: (report as any).patientId?.gender || "unknown",
        bloodGroup: (report as any).patientId?.bloodGroup || "—",
        allergies: (report as any).patientId?.allergies || [],
      },
      doctor: {
        _id: (report as any).doctorId?._id?.toString(),
        name: (report as any).doctorId?.name || "Ordering Physician",
        specialty: (report as any).doctorId?.specialty || "Internal Medicine",
      },
    };

    return NextResponse.json({ test: formatted });
  } catch (error: any) {
    console.error("Lab Test Detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load test details" },
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
    const session = await requireLabSession();
    const technicianName = session.user.name || "Lab Technician";
    const { id } = await context.params;
    const body = await request.json();
    const { action, results, technicianNotes, analyzerBench } = body;

    // Strict Permission check: Technicians cannot verify/approve/finalize
    if (
      action === "verify" ||
      action === "approve" ||
      action === "finalize" ||
      body.status === "verified" ||
      body.status === "finalized"
    ) {
      return NextResponse.json(
        {
          error:
            "Permission Denied: Lab Technicians cannot verify or approve results. Submit Result for Review routes reports to Pathologist review.",
        },
        { status: 403 }
      );
    }

    const report = await LabReport.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    if (analyzerBench) {
      (report as any).analyzerBench = analyzerBench;
    }

    if (results && Array.isArray(results)) {
      report.results = results
        .filter((r: any) => r && (r.parameter?.trim() || r.value !== undefined))
        .map((r: any) => ({
          parameter: r.parameter?.trim() || "Parameter",
          value: r.value !== undefined && r.value !== null ? String(r.value).trim() : "",
          unit: r.unit !== undefined && r.unit !== null ? String(r.unit).trim() : "",
          referenceRange: r.referenceRange !== undefined && r.referenceRange !== null ? String(r.referenceRange).trim() : "",
          flag: ["normal", "high", "low", "critical"].includes(r.flag)
            ? r.flag
            : "normal",
        }));
    }

    if (technicianNotes !== undefined) {
      (report as any).technicianNotes = technicianNotes;
    }

    if (action === "submit_result_for_review" || action === "submit_for_review") {
      if (!report.results || report.results.length === 0) {
        return NextResponse.json(
          { error: "At least one result parameter must be entered before submitting for review." },
          { status: 400 }
        );
      }

      const emptyValueRow = report.results.find((r) => !r.value || !r.value.trim());
      if (emptyValueRow) {
        return NextResponse.json(
          {
            error: `Please enter the measured value for '${emptyValueRow.parameter}' before submitting for Pathologist review.`,
          },
          { status: 400 }
        );
      }

      report.status = "submitted_for_review";
      (report as any).submittedForReviewAt = new Date();
      (report as any).submittedBy = technicianName;
      report.verifiedBy = "Awaiting Pathologist Review";
      await report.save();

      // Update sample status
      await LabSample.updateOne(
        { labReportId: report._id },
        { status: "analyzed" }
      );

      // Pathologist notification via NotificationService
      try {
        await NotificationService.notifyRole("PATHOLOGIST", {
          title: `Review Ready: ${report.testName}`,
          message: `${technicianName} submitted results for ${report.testName} (Sample: ${(report as any).sampleId || "N/A"}). Verification required.`,
          type: "lab_report",
          link: `/pathologist/reports/${report._id}`,
          relatedResource: {
            resourceType: "lab_report",
            resourceId: report._id.toString(),
          },
        });
      } catch (err) {
        console.error("Failed to dispatch pathologist notification:", err);
      }

      return NextResponse.json({
        success: true,
        message: "Result successfully submitted for Pathologist review.",
        status: report.status,
        test: report.toObject(),
      });
    }

    // Default action: save draft
    report.status = "result_entered";
    (report as any).resultEnteredAt = new Date();
    await report.save();

    return NextResponse.json({
      success: true,
      message: "Test results saved successfully.",
      status: report.status,
      test: report.toObject(),
    });
  } catch (error: any) {
    console.error("Lab Test Workbench PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save test results" },
      { status: 500 }
    );
  }
}
