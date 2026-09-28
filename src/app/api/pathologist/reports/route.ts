import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePathologistSession } from "@/lib/auth";
import { LabReport, Patient, Doctor } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePathologistSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const priority = searchParams.get("priority")?.trim() || "";
    const department = searchParams.get("department")?.trim() || "";

    const query: any = {};

    // Filter statuses relevant to the review workbench
    if (status && status !== "all") {
      query.status = status;
    } else {
      query.status = {
        $in: ["submitted_for_review", "under_review", "correction_required"],
      };
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    if (department && department !== "all") {
      query.department = department;
    }

    if (search) {
      // Find matching patients first
      const matchedPatients = await Patient.find({
        $or: [
          { mrn: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const matchedUserIds = (
        await (await import("@/models")).User.find({
          name: { $regex: search, $options: "i" },
        }).select("_id")
      ).map((u) => u._id);

      const patientIdsFromUsers = (
        await Patient.find({ userId: { $in: matchedUserIds } }).select("_id")
      ).map((p) => p._id);

      const allPatientIds = [
        ...matchedPatients.map((p) => p._id),
        ...patientIdsFromUsers,
      ];

      query.$or = [
        { testName: { $regex: search, $options: "i" } },
        { sampleId: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { patientId: { $in: allPatientIds } },
      ];
    }

    const reportsRaw = await LabReport.find(query)
      .populate({
        path: "patientId",
        select: "mrn dateOfBirth gender phone",
        populate: { path: "userId", select: "name email avatar" },
      })
      .populate("doctorId", "name specialty department")
      .sort({
        // Priority sort: stat first, then urgent, then routine
        priority: -1,
        submittedForReviewAt: -1,
        createdAt: -1,
      })
      .lean();

    const reports = reportsRaw.map((r: any) => {
      const patientUser = r.patientId?.userId as any;
      const criticalCount = (r.results || []).filter((i: any) => i.flag === "critical").length;
      const abnormalCount = (r.results || []).filter((i: any) => i.flag === "high" || i.flag === "low").length;

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
        status: r.status,
        summary: r.summary,
        technicianNotes: r.technicianNotes,
        pathologistInterpretation: r.pathologistInterpretation,
        resultsCount: (r.results || []).length,
        criticalCount,
        abnormalCount,
      };
    });

    return NextResponse.json({
      reports,
      totalCount: reports.length,
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
    console.error("Pathologist reports list error:", error);
    return NextResponse.json(
      { error: "Failed to load reports queue." },
      { status: 500 }
    );
  }
}
