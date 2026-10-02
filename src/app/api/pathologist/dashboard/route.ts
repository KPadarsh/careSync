import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePathologistSession } from "@/lib/auth";
import { LabReport, Patient, Doctor, Notification } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePathologistSession();
    await connectToDatabase();

    const [
      awaitingReviewCount,
      underReviewCount,
      verifiedCount,
      correctionRequiredCount,
      awaitingReportsRaw,
      underReviewReportsRaw,
      recentVerifiedReportsRaw,
      correctionReportsRaw,
      unreadNotifCount,
    ] = await Promise.all([
      LabReport.countDocuments({ status: "submitted_for_review" }),
      LabReport.countDocuments({ status: "under_review" }),
      LabReport.countDocuments({ status: { $in: ["verified", "finalized"] } }),
      LabReport.countDocuments({ status: "correction_required" }),
      LabReport.find({ status: "submitted_for_review" })
        .populate({
          path: "patientId",
          select: "mrn dateOfBirth gender phone",
          populate: { path: "userId", select: "name email avatar" },
        })
        .populate("doctorId", "name specialty department")
        .sort({ priority: -1, submittedForReviewAt: -1, createdAt: -1 })
        .limit(10)
        .lean(),
      LabReport.find({ status: "under_review" })
        .populate({
          path: "patientId",
          select: "mrn dateOfBirth gender phone",
          populate: { path: "userId", select: "name email avatar" },
        })
        .populate("doctorId", "name specialty department")
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean(),
      LabReport.find({ status: { $in: ["verified", "finalized"] } })
        .populate({
          path: "patientId",
          select: "mrn dateOfBirth gender phone",
          populate: { path: "userId", select: "name email avatar" },
        })
        .populate("doctorId", "name specialty department")
        .sort({ verifiedDate: -1, verifiedAt: -1, updatedAt: -1 })
        .limit(10)
        .lean(),
      LabReport.find({ status: "correction_required" })
        .populate({
          path: "patientId",
          select: "mrn dateOfBirth gender phone",
          populate: { path: "userId", select: "name email avatar" },
        })
        .populate("doctorId", "name specialty department")
        .sort({ correctionRequestedAt: -1, updatedAt: -1 })
        .limit(5)
        .lean(),
      Notification.countDocuments({
        recipientId: session.user._id,
        isRead: false,
      }),
    ]);

    // Format reports for clean front-end consumption
    const formatReport = (r: any) => {
      const patientUser = r.patientId?.userId as any;
      const criticalCount = (r.results || []).filter((item: any) => item.flag === "critical").length;
      const abnormalCount = (r.results || []).filter((item: any) => item.flag === "high" || item.flag === "low").length;

      return {
        id: r._id.toString(),
        patient: {
          id: r.patientId?._id?.toString() || "",
          name: patientUser?.name || "Patient Record",
          mrn: r.patientId?.mrn || "MRN-N/A",
          gender: r.patientId?.gender || "Unknown",
          dob: r.patientId?.dateOfBirth,
        },
        doctor: {
          id: r.doctorId?._id?.toString() || "",
          name: r.doctorId?.name || "Ordering Physician",
          department: r.doctorId?.department || r.department,
        },
        testName: r.testName,
        department: r.department,
        priority: r.priority || "routine",
        sampleId: r.sampleId || "Pending",
        sampleType: r.sampleType,
        tubeType: r.tubeType,
        submittedBy: r.submittedBy || "Lab Technician",
        submittedForReviewAt: r.submittedForReviewAt || r.updatedAt,
        underReviewAt: r.underReviewAt,
        underReviewBy: r.underReviewBy,
        correctionReason: r.correctionReason,
        correctionRequestedAt: r.correctionRequestedAt,
        verifiedBy: r.verifiedBy,
        verifiedDate: r.verifiedDate || r.verifiedAt,
        status: r.status,
        summary: r.summary,
        technicianNotes: r.technicianNotes,
        pathologistInterpretation: r.pathologistInterpretation,
        resultsCount: (r.results || []).length,
        criticalCount,
        abnormalCount,
      };
    };

    return NextResponse.json({
      metrics: {
        awaitingReviewCount,
        underReviewCount,
        verifiedCount,
        correctionRequiredCount,
        unreadNotifCount,
      },
      queues: {
        awaiting: awaitingReportsRaw.map(formatReport),
        underReview: underReviewReportsRaw.map(formatReport),
        verified: recentVerifiedReportsRaw.map(formatReport),
        correction: correctionReportsRaw.map(formatReport),
      },
      pathologist: {
        id: session.user._id.toString(),
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        title: "Medical Director, Clinical Pathology",
        boardCertification: "American Board of Pathology (AP/CP)",
      },
    });
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403 || error.message?.includes("access required") || error.message?.includes("Authentication required") || error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: error.message || "Unauthorized: Pathologist access required." },
        { status: error.statusCode || 403 }
      );
    }
    console.error("Pathologist dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load pathologist dashboard data." },
      { status: 500 }
    );
  }
}
