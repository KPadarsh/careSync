import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession } from "@/lib/auth";
import { LabReport, Patient, Doctor, LabSample } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabTechSession();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, processing, ready, completed
    const search = searchParams.get("search")?.trim().toLowerCase();

    const query: any = {
      status: {
        $in: [
          "sample-collected",
          "processing",
          "result-entered",
          "submitted-for-review",
          "verified",
        ],
      },
    };

    if (filter === "processing") {
      query.status = { $in: ["sample-collected", "processing"] };
    } else if (filter === "ready") {
      query.status = "result-entered";
    } else if (filter === "completed") {
      query.status = { $in: ["submitted-for-review", "verified", "finalized"] };
    }

    const tests = await LabReport.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup phone allergies",
        populate: { path: "userId", select: "name email avatar" },
      })
      .populate("doctorId", "name specialty department")
      .populate("sampleId", "sampleId barcode containerType status storageLocation")
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
          : 34;

        return {
          _id: t._id.toString(),
          testName: t.testName,
          department: t.department,
          priority: t.priority || "routine",
          status: t.status,
          sampleCode: t.sampleId?.sampleId || t.sampleCode || "Pending",
          barcode: t.sampleId?.barcode || "N/A",
          sampleLocation: t.sampleId?.storageLocation || "Phlebotomy Bench",
          resultsCount: t.results?.length || 0,
          technicianNotes: t.technicianNotes || "",
          submittedAt: t.submittedAt,
          submittedBy: t.submittedBy,
          createdAt: t.createdAt,
          patient: {
            _id: t.patientId?._id?.toString(),
            name: patientName,
            mrn: t.patientId?.mrn || "MRN-N/A",
            age,
            gender: t.patientId?.gender || "male",
            bloodGroup: t.patientId?.bloodGroup || "O+",
          },
          doctor: {
            name: t.doctorId?.name || "Attending Physician",
            specialty: t.doctorId?.specialty || "Internal Medicine",
          },
        };
      })
      .filter((t) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          t.testName.toLowerCase().includes(q) ||
          t.sampleCode.toLowerCase().includes(q) ||
          t.patient.name.toLowerCase().includes(q) ||
          t.patient.mrn.toLowerCase().includes(q) ||
          t.doctor.name.toLowerCase().includes(q)
        );
      });

    const counts = {
      all: formatted.length,
      processing: formatted.filter((t) =>
        ["sample-collected", "processing"].includes(t.status)
      ).length,
      ready: formatted.filter((t) => t.status === "result-entered").length,
      completed: formatted.filter((t) =>
        ["submitted-for-review", "verified", "finalized"].includes(t.status)
      ).length,
    };

    return NextResponse.json({
      tests: formatted,
      counts,
    });
  } catch (error: any) {
    console.error("Lab tests GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load laboratory test queue" },
      { status: 500 }
    );
  }
}
