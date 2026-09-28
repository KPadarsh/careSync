import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";
import { LabReport, LabSample, Patient, Doctor } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireLabSession();
    const technicianUser = session.user;

    // 1. Core Metrics required by prompt:
    // - new requests (requested or pending)
    // - samples pending (sample_pending)
    // - processing tests (sample_collected or processing)
    // - results awaiting submission (result_entered)
    // - completed work (submitted_for_review, verified, finalized)

    const [
      newRequests,
      samplesPending,
      processingTests,
      resultsAwaitingSubmission,
      completedWork,
    ] = await Promise.all([
      LabReport.countDocuments({
        status: { $in: ["requested", "pending"] },
      }),
      LabReport.countDocuments({
        status: "sample_pending",
      }),
      LabReport.countDocuments({
        status: { $in: ["sample_collected", "processing"] },
      }),
      LabReport.countDocuments({
        status: "result_entered",
      }),
      LabReport.countDocuments({
        status: { $in: ["submitted_for_review", "verified", "finalized"] },
      }),
    ]);

    // 2. Recent Requisitions (Latest 8)
    const recentRequestsDocs = await LabReport.find({})
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup",
        populate: { path: "userId", select: "name avatar" },
      })
      .populate("doctorId", "name specialty department")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const formattedRequests = recentRequestsDocs.map((r: any) => {
      const patientName =
        r.patientId?.userId?.name ||
        `${r.patientId?.firstName || ""} ${r.patientId?.lastName || ""}`.trim() ||
        "Patient";
      const age = r.patientId?.dateOfBirth
        ? Math.floor(
            (Date.now() - new Date(r.patientId.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : 35;

      return {
        _id: r._id.toString(),
        testName: r.testName,
        department: r.department,
        priority: r.priority || "routine",
        status: r.status,
        sampleId: r.sampleId,
        requestedDate: r.createdAt || r.sampleCollectionDate,
        summary: r.summary,
        resultsCount: r.results?.length || 0,
        patient: {
          _id: r.patientId?._id?.toString(),
          name: patientName,
          mrn: r.patientId?.mrn || "MRN-N/A",
          age,
          gender: r.patientId?.gender || "unknown",
          bloodGroup: r.patientId?.bloodGroup || "O+",
          avatar: r.patientId?.userId?.avatar,
        },
        doctor: {
          _id: r.doctorId?._id?.toString(),
          name: r.doctorId?.name || "Dr. Anil Kumar",
          specialty: r.doctorId?.specialty || "General Medicine",
        },
      };
    });

    // 3. Active Samples at Benches (Latest 6)
    const activeSamplesDocs = await LabSample.find({
      status: { $in: ["collected", "processing", "analyzed"] },
    })
      .populate({
        path: "patientId",
        select: "firstName lastName mrn",
        populate: { path: "userId", select: "name" },
      })
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    const formattedSamples = activeSamplesDocs.map((s: any) => ({
      _id: s._id.toString(),
      sampleId: s.sampleId,
      labReportId: s.labReportId?.toString(),
      testName: s.testName,
      department: s.department,
      specimenType: s.specimenType,
      tubeType: s.tubeType,
      barcode: s.barcode,
      storageLocation: s.storageLocation,
      status: s.status,
      collectedAt: s.collectedAt,
      collectedBy: s.collectedBy,
      patientName:
        s.patientId?.userId?.name ||
        `${s.patientId?.firstName || ""} ${s.patientId?.lastName || ""}`.trim() ||
        "Patient",
      mrn: s.patientId?.mrn || "MRN-N/A",
    }));

    // 4. Results Awaiting Submission (result_entered)
    const awaitingSubmissionDocs = await LabReport.find({
      status: "result_entered",
    })
      .populate({
        path: "patientId",
        select: "firstName lastName mrn",
        populate: { path: "userId", select: "name" },
      })
      .populate("doctorId", "name")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const formattedAwaiting = awaitingSubmissionDocs.map((a: any) => ({
      _id: a._id.toString(),
      testName: a.testName,
      department: a.department,
      priority: a.priority || "routine",
      sampleId: a.sampleId,
      resultsCount: a.results?.length || 0,
      updatedAt: a.updatedAt,
      patientName:
        a.patientId?.userId?.name ||
        `${a.patientId?.firstName || ""} ${a.patientId?.lastName || ""}`.trim() ||
        "Patient",
      mrn: a.patientId?.mrn || "MRN-N/A",
      doctorName: a.doctorId?.name || "Dr. Anil Kumar",
    }));

    return NextResponse.json({
      metrics: {
        newRequests,
        samplesPending,
        processingTests,
        resultsAwaitingSubmission,
        completedWork,
      },
      recentRequests: formattedRequests,
      activeSamples: formattedSamples,
      pendingSubmissions: formattedAwaiting,
      technician: {
        name: technicianUser.name || "Vikram Malhotra",
        email: technicianUser.email,
        station: "Central Diagnostic Lab • Station 2",
        role: "Medical Laboratory Technologist (MLT)",
        shift: "Morning Analytical Shift (08:00 - 16:30)",
      },
    });
  } catch (error: any) {
    console.error("Lab Dashboard GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load laboratory dashboard data" },
      { status: 500 }
    );
  }
}
