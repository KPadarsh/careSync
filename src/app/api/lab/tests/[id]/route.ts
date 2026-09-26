import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession } from "@/lib/auth";
import { LabReport, Patient, Doctor, LabSample, Notification, User } from "@/models";
import { ROLES } from "@/lib/constants";
import mongoose from "mongoose";

// Standard laboratory test parameter templates for quick clinical entry
const DEFAULT_TEST_TEMPLATES: Record<
  string,
  Array<{ parameter: string; unit: string; referenceRange: string; defaultValue?: string }>
> = {
  cbc: [
    { parameter: "Hemoglobin", unit: "g/dL", referenceRange: "13.5 - 17.5", defaultValue: "14.2" },
    { parameter: "White Blood Cells (WBC)", unit: "x10³/µL", referenceRange: "4.5 - 11.0", defaultValue: "6.8" },
    { parameter: "Red Blood Cells (RBC)", unit: "x10⁶/µL", referenceRange: "4.5 - 5.9", defaultValue: "4.9" },
    { parameter: "Platelet Count", unit: "x10³/µL", referenceRange: "150 - 450", defaultValue: "245" },
    { parameter: "Hematocrit (PCV)", unit: "%", referenceRange: "41.0 - 50.0", defaultValue: "43.5" },
    { parameter: "Mean Corpuscular Volume (MCV)", unit: "fL", referenceRange: "80.0 - 100.0", defaultValue: "88.0" },
    { parameter: "Neutrophils", unit: "%", referenceRange: "40.0 - 70.0", defaultValue: "58.0" },
    { parameter: "Lymphocytes", unit: "%", referenceRange: "20.0 - 40.0", defaultValue: "32.0" },
  ],
  lipid: [
    { parameter: "Total Cholesterol", unit: "mg/dL", referenceRange: "< 200", defaultValue: "215" },
    { parameter: "Triglycerides", unit: "mg/dL", referenceRange: "< 150", defaultValue: "165" },
    { parameter: "HDL Cholesterol", unit: "mg/dL", referenceRange: "> 40", defaultValue: "42" },
    { parameter: "LDL Cholesterol", unit: "mg/dL", referenceRange: "< 100", defaultValue: "140" },
    { parameter: "VLDL Cholesterol", unit: "mg/dL", referenceRange: "5 - 30", defaultValue: "33" },
    { parameter: "Cholesterol / HDL Ratio", unit: "ratio", referenceRange: "< 4.5", defaultValue: "5.1" },
  ],
  glucose: [
    { parameter: "Fasting Blood Glucose", unit: "mg/dL", referenceRange: "70 - 99", defaultValue: "108" },
    { parameter: "HbA1c (Glycated Hemoglobin)", unit: "%", referenceRange: "< 5.7", defaultValue: "6.1" },
    { parameter: "Estimated Average Glucose (eAG)", unit: "mg/dL", referenceRange: "90 - 120", defaultValue: "128" },
  ],
  rft: [
    { parameter: "Blood Urea Nitrogen (BUN)", unit: "mg/dL", referenceRange: "7 - 20", defaultValue: "14" },
    { parameter: "Serum Creatinine", unit: "mg/dL", referenceRange: "0.7 - 1.3", defaultValue: "0.95" },
    { parameter: "eGFR (Estimated GFR)", unit: "mL/min/1.73m²", referenceRange: "> 90", defaultValue: "98" },
    { parameter: "Serum Uric Acid", unit: "mg/dL", referenceRange: "3.5 - 7.2", defaultValue: "5.4" },
    { parameter: "Sodium", unit: "mEq/L", referenceRange: "136 - 145", defaultValue: "140" },
    { parameter: "Potassium", unit: "mEq/L", referenceRange: "3.5 - 5.1", defaultValue: "4.3" },
  ],
  tsh: [
    { parameter: "Thyroid Stimulating Hormone (TSH)", unit: "µIU/mL", referenceRange: "0.45 - 4.50", defaultValue: "2.85" },
    { parameter: "Free Thyroxine (FT4)", unit: "ng/dL", referenceRange: "0.82 - 1.77", defaultValue: "1.25" },
    { parameter: "Free Triiodothyronine (FT3)", unit: "pg/mL", referenceRange: "2.0 - 4.4", defaultValue: "3.1" },
  ],
};

function getTemplateForTest(testName: string) {
  const t = testName.toLowerCase();
  if (t.includes("cbc") || t.includes("blood count") || t.includes("hemogram")) return DEFAULT_TEST_TEMPLATES.cbc;
  if (t.includes("lipid") || t.includes("cholesterol")) return DEFAULT_TEST_TEMPLATES.lipid;
  if (t.includes("glucose") || t.includes("sugar") || t.includes("hba1c")) return DEFAULT_TEST_TEMPLATES.glucose;
  if (t.includes("rft") || t.includes("renal") || t.includes("kidney") || t.includes("creatinine")) return DEFAULT_TEST_TEMPLATES.rft;
  if (t.includes("tsh") || t.includes("thyroid")) return DEFAULT_TEST_TEMPLATES.tsh;
  return [
    { parameter: "Primary Diagnostic Marker", unit: "Index / Value", referenceRange: "Clinical Baseline", defaultValue: "Within normal limits" },
    { parameter: "Secondary Marker", unit: "Unit", referenceRange: "Standard Range", defaultValue: "Negative" },
  ];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireLabTechSession();
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
    }

    const report = await LabReport.findById(id)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup phone allergies emergencyContact",
        populate: { path: "userId", select: "name email avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber")
      .populate("sampleId")
      .lean();

    if (!report) {
      return NextResponse.json({ error: "Laboratory test not found" }, { status: 404 });
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

    const template = getTemplateForTest(report.testName);

    // Merge existing results with template if not filled yet
    let results = report.results || [];
    if (results.length === 0) {
      results = template.map((item) => ({
        parameter: item.parameter,
        value: item.defaultValue || "",
        unit: item.unit,
        referenceRange: item.referenceRange,
        flag: "normal" as const,
      }));
    }

    return NextResponse.json({
      test: {
        _id: report._id.toString(),
        testName: report.testName,
        department: report.department,
        priority: report.priority || "routine",
        status: report.status,
        clinicalReason: report.clinicalReason || "",
        instructions: report.instructions || "",
        sampleCode: report.sampleId ? (report.sampleId as any).sampleId : report.sampleCode || "SMP-Pending",
        barcode: report.sampleId ? (report.sampleId as any).barcode : "N/A",
        sampleType: report.sampleId ? (report.sampleId as any).sampleType : "Venous Blood",
        containerType: report.sampleId ? (report.sampleId as any).containerType : "Standard Collection Tube",
        collectionVolume: report.sampleId ? (report.sampleId as any).collectionVolume : "4 mL",
        sampleCollectionDate: report.sampleCollectionDate,
        technicianNotes: report.technicianNotes || "",
        summary: report.summary,
        results,
        patient: {
          _id: (report.patientId as any)?._id?.toString(),
          name: patientName,
          mrn: (report.patientId as any)?.mrn || "MRN-N/A",
          age,
          gender: (report.patientId as any)?.gender || "male",
          bloodGroup: (report.patientId as any)?.bloodGroup || "O+",
        },
        doctor: {
          name: (report.doctorId as any)?.name || "Attending Physician",
          specialty: (report.doctorId as any)?.specialty || "General Medicine",
        },
      },
    });
  } catch (error: any) {
    console.error("Lab test detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load test detail" },
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
      return NextResponse.json({ error: "Invalid test ID" }, { status: 400 });
    }

    const report = await LabReport.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Laboratory test not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, results, technicianNotes } = body;

    // STRICT PERMISSION GUARD:
    // Lab Technician cannot verify, approve, or finalize pathology reports.
    if (action === "verify" || action === "approve" || action === "finalize") {
      return NextResponse.json(
        {
          error:
            "Permission Denied: Lab Technician role does not possess permissions to verify pathology reports. Only certified Pathologists can verify and release diagnostic results.",
        },
        { status: 403 }
      );
    }

    if (results && Array.isArray(results)) {
      report.results = results.map((r: any) => ({
        parameter: r.parameter,
        value: String(r.value || "").trim(),
        unit: String(r.unit || "").trim(),
        referenceRange: String(r.referenceRange || "").trim(),
        flag: ["normal", "high", "low", "critical"].includes(r.flag) ? r.flag : "normal",
      }));
    }

    if (technicianNotes !== undefined) {
      report.technicianNotes = technicianNotes.trim();
    }

    if (action === "save-draft") {
      report.status = "result-entered";
      report.summary = `Diagnostic values entered by ${session.user.name}. Draft saved in technician worklist.`;
      await report.save();

      return NextResponse.json({
        success: true,
        message: "Test results saved as draft.",
        status: report.status,
      });
    }

    if (action === "submit-review") {
      report.status = "submitted-for-review";
      report.submittedAt = new Date();
      report.submittedBy = session.user.name;
      report.summary = `Results entered and submitted by Technician ${session.user.name}. Awaiting pathologist clinical verification.`;
      await report.save();

      // Dispatch notification to Pathologist
      const pathologistUser = await User.findOne({ role: ROLES.PATHOLOGIST });
      if (pathologistUser) {
        await Notification.create({
          recipientId: pathologistUser._id,
          title: `Diagnostic Review Required: ${report.testName}`,
          message: `Technician ${session.user.name} submitted test results for verification. Priority: ${report.priority}.`,
          type: "lab_report",
          link: `/pathology/review/${report._id}`,
          isRead: false,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Diagnostic results successfully submitted for Pathologist review.",
        status: report.status,
      });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("Lab test submission POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process test results submission" },
      { status: 500 }
    );
  }
}
