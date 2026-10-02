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
          "firstName lastName mrn dateOfBirth gender bloodGroup phone address emergencyContact insurance allergies",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate(
        "doctorId",
        "name specialty department qualification roomNumber availableDays"
      )
      .populate("sampleDocId")
      .lean();

    if (!report) {
      return NextResponse.json(
        { error: "Lab requisition not found" },
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

    // Check if sample exists for this report
    let sample = (report as any).sampleDocId;
    if (!sample && report.sampleId) {
      sample = await LabSample.findOne({ sampleId: report.sampleId }).lean();
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
      analyzerBench: (report as any).analyzerBench,
      resultEnteredAt: (report as any).resultEnteredAt,
      submittedForReviewAt: (report as any).submittedForReviewAt,
      submittedBy: (report as any).submittedBy,
      verifiedDate: report.verifiedDate,
      verifiedBy: report.verifiedBy,
      summary: report.summary,
      technicianNotes: (report as any).technicianNotes,
      pathologistNotes: (report as any).pathologistNotes,
      results: report.results || [],
      fileUrl: report.fileUrl,
      sample: sample
        ? {
            _id: sample._id.toString(),
            sampleId: sample.sampleId,
            specimenType: sample.specimenType,
            tubeType: sample.tubeType,
            barcode: sample.barcode,
            barcodeToken: sample.barcodeToken,
            collectionSite: sample.collectionSite,
            collectedAt: sample.collectedAt,
            collectedBy: sample.collectedBy,
            storageLocation: sample.storageLocation,
            volume: sample.volume,
            status: sample.status,
            technicianNotes: sample.technicianNotes,
          }
        : null,
      patient: {
        _id: (report as any).patientId?._id?.toString(),
        name: patientName,
        mrn: (report as any).patientId?.mrn || "MRN-N/A",
        age,
        gender: (report as any).patientId?.gender || "unknown",
        bloodGroup: (report as any).patientId?.bloodGroup || "O+",
        allergies: (report as any).patientId?.allergies || [],
        phone:
          (report as any).patientId?.phone ||
          (report as any).patientId?.userId?.phone ||
          "N/A",
        avatar: (report as any).patientId?.userId?.avatar,
        address: (report as any).patientId?.address,
        emergencyContact: (report as any).patientId?.emergencyContact,
        insurance: (report as any).patientId?.insurance,
      },
      doctor: {
        _id: (report as any).doctorId?._id?.toString(),
        name: (report as any).doctorId?.name || "Ordering Physician",
        specialty: (report as any).doctorId?.specialty || "Internal Medicine",
        department: (report as any).doctorId?.department || "Cardiology",
        roomNumber: (report as any).doctorId?.roomNumber || "Consultation Room",
      },
    };

    return NextResponse.json({ request: formatted });
  } catch (error: any) {
    console.error("Lab Request Detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load request detail" },
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
    const { action } = body;

    // Strict Permissions: Lab Technician cannot verify, approve, or finalize
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
            "Permission Denied: Lab Technicians cannot verify or finalize pathology reports. Result verification is strictly restricted to Board Certified Pathologists.",
        },
        { status: 403 }
      );
    }

    const report = await LabReport.findById(id);
    if (!report) {
      return NextResponse.json(
        { error: "Lab requisition not found" },
        { status: 404 }
      );
    }

    // 1. ACTION: collect_sample / record_sample
    if (action === "collect_sample" || action === "record_sample") {
      const {
        specimenType = "Venous Blood",
        tubeType = "Lavender Top (EDTA)",
        collectionSite = "Central Phlebotomy Station 2",
        storageLocation = "Rack A-02 / Ambient",
        volume = "4.0 mL",
        notes,
      } = body;

      // Generate standardized sample identifier SMP-2026-XXXXX
      let sampleId = body.sampleId;
      if (!sampleId) {
        const count = await LabSample.countDocuments();
        const seq = (count + 125).toString().padStart(5, "0");
        sampleId = `SMP-2026-${seq}`;
      }

      // Generate secure non-PII barcode token (e.g. CS-SMP-2026-00125-TK78)
      // Never encode sensitive patient information in barcode
      const randomToken = Math.random().toString(36).substring(2, 6).toUpperCase();
      const barcode = `CS-${sampleId}-${randomToken}`;
      const barcodeToken = `${sampleId}-${randomToken}`;

      // Create or update LabSample document
      let sample = await LabSample.findOne({ labReportId: report._id });
      if (sample) {
        sample.specimenType = specimenType;
        sample.tubeType = tubeType;
        sample.collectionSite = collectionSite;
        sample.storageLocation = storageLocation;
        sample.volume = volume;
        sample.status = "collected";
        sample.collectedAt = new Date();
        sample.collectedBy = technicianName;
        if (notes) sample.technicianNotes = notes;
        await sample.save();
      } else {
        sample = await LabSample.create({
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
          technicianNotes: notes || `Sample collected by ${technicianName}`,
        });
      }

      // Update report status to sample_collected
      report.status = "sample_collected";
      (report as any).sampleId = sample.sampleId;
      (report as any).sampleDocId = sample._id as any;
      (report as any).sampleType = specimenType;
      (report as any).tubeType = tubeType;
      (report as any).barcode = barcode;
      (report as any).sampleCollectedAt = new Date();
      (report as any).sampleCollectedBy = technicianName;
      if (notes) (report as any).technicianNotes = notes;
      await report.save();

      return NextResponse.json({
        success: true,
        message: `Sample ${sample.sampleId} recorded successfully.`,
        status: report.status,
        sample: sample.toObject(),
        report: report.toObject(),
      });
    }

    // 2. ACTION: begin_processing
    if (action === "begin_processing" || action === "start_processing") {
      const { analyzerBench = "Roche Cobas 6000 Chemistry Analyzer", notes } = body;

      report.status = "processing";
      (report as any).processingStartedAt = new Date();
      (report as any).processingBy = technicianName;
      (report as any).analyzerBench = analyzerBench;
      if (notes) (report as any).technicianNotes = notes;
      await report.save();

      // Update sample status
      await LabSample.updateOne(
        { labReportId: report._id },
        { status: "processing" }
      );

      return NextResponse.json({
        success: true,
        message: `Analysis begun on bench ${analyzerBench}.`,
        status: report.status,
        report: report.toObject(),
      });
    }

    // 3. ACTION: enter_result / save_results
    if (action === "enter_result" || action === "save_results") {
      const { results, technicianNotes } = body;

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

      report.status = "result_entered";
      (report as any).resultEnteredAt = new Date();
      if (technicianNotes) (report as any).technicianNotes = technicianNotes;
      await report.save();

      return NextResponse.json({
        success: true,
        message: "Test parameter results saved.",
        status: report.status,
        report: report.toObject(),
      });
    }

    // 4. ACTION: submit_result_for_review
    if (action === "submit_result_for_review" || action === "submit_for_review") {
      const { results, technicianNotes } = body;

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

      if (!report.results || report.results.length === 0) {
        return NextResponse.json(
          { error: "At least one test result parameter is required to submit for review." },
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
      if (technicianNotes) (report as any).technicianNotes = technicianNotes;
      await report.save();

      // Update sample status to analyzed
      await LabSample.updateOne(
        { labReportId: report._id },
        { status: "analyzed" }
      );

      // Create notification for Pathologist via NotificationService
      try {
        await NotificationService.notifyRole("PATHOLOGIST", {
          title: `Review Requisition: ${report.testName}`,
          message: `Technician ${technicianName} submitted results for ${report.testName} (Sample: ${(report as any).sampleId || "N/A"}). Review and verification required.`,
          type: "lab_report",
          link: `/pathologist/reports/${report._id}`,
          relatedResource: {
            resourceType: "lab_report",
            resourceId: report._id.toString(),
          },
        });
      } catch (err) {
        console.error("Pathologist notification creation failed:", err);
      }

      return NextResponse.json({
        success: true,
        message: "Result successfully submitted for Pathologist review.",
        status: report.status,
        report: report.toObject(),
      });
    }

    // Direct status update fallback (e.g. mark sample_pending)
    if (body.status) {
      if (
        [
          "requested",
          "sample_pending",
          "sample_collected",
          "processing",
          "result_entered",
          "submitted_for_review",
        ].includes(body.status)
      ) {
        report.status = body.status;
        if (body.technicianNotes) (report as any).technicianNotes = body.technicianNotes;
        await report.save();
        return NextResponse.json({ success: true, report: report.toObject() });
      }
    }

    return NextResponse.json(
      { error: "Invalid action or unhandled technician request state" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Lab Request Detail PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lab request" },
      { status: 500 }
    );
  }
}
