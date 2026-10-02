import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";
import { LabReport, Patient, Doctor } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabSession();

    const { searchParams } = new URL(request.url);
    const bench = searchParams.get("bench")?.toLowerCase() || "all";
    const status = searchParams.get("status")?.toLowerCase() || "all";
    const search = searchParams.get("search")?.trim().toLowerCase();

    // In Workbench: tests currently in sample_collected, processing, or result_entered
    const query: any = {
      status: {
        $in: ["sample_collected", "processing", "result_entered", "in-progress"],
      },
    };

    if (status && status !== "all") {
      query.status = status;
    }

    if (bench && bench !== "all") {
      query.department = { $regex: new RegExp(bench, "i") };
    }

    const tests = await LabReport.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup allergies",
        populate: { path: "userId", select: "name avatar" },
      })
      .populate("doctorId", "name specialty department")
      .populate("sampleDocId")
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    const formatted = tests
      .map((t: any) => {
        const patientName =
          t.patientId?.userId?.name ||
          `${t.patientId?.firstName || ""} ${t.patientId?.lastName || ""}`.trim() ||
          "Patient";

        const age = t.patientId?.dateOfBirth
          ? Math.floor(
              (Date.now() - new Date(t.patientId.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 35;

        return {
          _id: t._id.toString(),
          testName: t.testName,
          department: t.department,
          priority: t.priority || "routine",
          status: t.status,
          sampleId: t.sampleId || "Awaiting Barcode",
          sampleType: t.sampleType || "Blood",
          tubeType: t.tubeType || "Lavender (EDTA)",
          barcode: t.barcode,
          analyzerBench: t.analyzerBench || "Standard Analytical Station",
          requestedDate: t.createdAt || t.sampleCollectionDate,
          sampleCollectedAt: t.sampleCollectedAt,
          processingStartedAt: t.processingStartedAt,
          resultEnteredAt: t.resultEnteredAt,
          resultsCount: t.results?.length || 0,
          results: t.results || [],
          summary: t.summary,
          technicianNotes: t.technicianNotes,
          patient: {
            _id: t.patientId?._id?.toString(),
            name: patientName,
            mrn: t.patientId?.mrn || "MRN-N/A",
            age,
            gender: t.patientId?.gender || "unknown",
            bloodGroup: t.patientId?.bloodGroup || "—",
            allergies: t.patientId?.allergies || [],
            avatar: t.patientId?.userId?.avatar,
          },
          doctor: {
            _id: t.doctorId?._id?.toString(),
            name: t.doctorId?.name || "Ordering Physician",
            specialty: t.doctorId?.specialty || "Internal Medicine",
          },
        };
      })
      .filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          t.testName.toLowerCase().includes(q) ||
          t.sampleId.toLowerCase().includes(q) ||
          t.patient.name.toLowerCase().includes(q) ||
          t.patient.mrn.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q)
        );
      });

    return NextResponse.json({ tests: formatted });
  } catch (error: any) {
    console.error("Lab Tests Workbench GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load laboratory tests workbench" },
      { status: 500 }
    );
  }
}
