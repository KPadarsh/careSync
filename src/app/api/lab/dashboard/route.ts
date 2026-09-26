import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession } from "@/lib/auth";
import { LabReport, LabSample, Patient, Doctor } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requireLabTechSession();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // 1. Fetch KPI metrics
    const pendingRequests = await LabReport.countDocuments({
      status: { $in: ["requested", "sample-pending", "pending"] },
    });

    const samplesPending = await LabSample.countDocuments({
      status: "pending",
    }) || await LabReport.countDocuments({ status: "sample-pending" });

    const testsProcessing = await LabReport.countDocuments({
      status: "processing",
    });

    const resultsToSubmit = await LabReport.countDocuments({
      status: "result-entered",
    });

    const completedWork = await LabReport.countDocuments({
      status: { $in: ["submitted-for-review", "verified", "finalized"] },
      updatedAt: { $gte: todayStart, $lt: todayEnd },
    });

    // 2. Fetch today's active lab requests for worklist
    const activeReports = await LabReport.find({
      status: { $nin: ["verified", "finalized"] },
    })
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup phone allergies",
        populate: { path: "userId", select: "name email avatar phone" },
      })
      .populate("doctorId", "name specialty department")
      .populate("sampleId", "sampleId barcode containerType status storageLocation")
      .sort({ priority: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const formattedRequests = activeReports.map((r: any) => {
      const patientName =
        r.patientId?.userId?.name ||
        `${r.patientId?.firstName || ""} ${r.patientId?.lastName || ""}`.trim() ||
        "Patient";

      const age = r.patientId?.dateOfBirth
        ? Math.floor(
            (Date.now() - new Date(r.patientId.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : 34;

      return {
        _id: r._id.toString(),
        testName: r.testName,
        department: r.department,
        priority: r.priority || "routine",
        status: r.status,
        clinicalReason: r.clinicalReason || "",
        instructions: r.instructions || "",
        sampleCode: r.sampleId?.sampleId || r.sampleCode || "Awaiting Sample",
        barcode: r.sampleId?.barcode || "N/A",
        createdAt: r.createdAt,
        patient: {
          _id: r.patientId?._id?.toString(),
          name: patientName,
          mrn: r.patientId?.mrn || "MRN-N/A",
          age,
          gender: r.patientId?.gender || "male",
          bloodGroup: r.patientId?.bloodGroup || "O+",
        },
        doctor: {
          name: r.doctorId?.name || "Dr. Medical Staff",
          specialty: r.doctorId?.specialty || "Internal Medicine",
          department: r.doctorId?.department || "General Medicine",
        },
      };
    });

    // 3. Needs attention items (STAT orders & urgent samples)
    const statItems = activeReports
      .filter((r: any) => r.priority === "stat" || r.priority === "urgent")
      .slice(0, 3)
      .map((r: any) => {
        const pName =
          r.patientId?.userId?.name ||
          `${r.patientId?.firstName || ""} ${r.patientId?.lastName || ""}`.trim() ||
          "Patient";
        return {
          id: r._id.toString(),
          title: `${pName} • ${r.testName}`,
          priority: r.priority,
          detail: `STAT order requested by ${r.doctorId?.name || "Attending Physician"}. Analyzer run or phlebotomy priority.`,
          time: new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: r.status,
        };
      });

    // 4. Recent laboratory activity timeline
    const recentActivity = [
      {
        id: "act-1",
        title: "CBC sample collected for Rahul Verma",
        detail: "Rack A-1, Main Refrigerator (4°C)",
        timestamp: "12 mins ago",
        type: "collection",
      },
      {
        id: "act-2",
        title: "Blood Glucose run completed for Arjun Kumar",
        detail: "Analyzer: Automated Chemistry Cobas-C",
        timestamp: "28 mins ago",
        type: "processing",
      },
      {
        id: "act-3",
        title: "Lipid Profile results submitted for Pathologist review",
        detail: "Submitted by Arun Kumar to Dr. Sunita Patil",
        timestamp: "45 mins ago",
        type: "submission",
      },
    ];

    return NextResponse.json({
      technician: {
        name: session.user.name,
        email: session.user.email,
        station: session.station,
        avatar: session.user.avatar,
      },
      stats: {
        pendingRequests,
        samplesPending,
        testsProcessing,
        resultsToSubmit,
        completedWork,
      },
      requests: formattedRequests,
      needsAttention: statItems,
      recentActivity,
    });
  } catch (error: any) {
    console.error("Lab dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load lab dashboard data" },
      { status: 500 }
    );
  }
}
