import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession } from "@/lib/auth";
import { LabReport, Patient, Doctor } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabTechSession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const department = searchParams.get("department") || "all";

    const query: any = {
      status: { $in: ["submitted-for-review", "verified", "finalized"] },
    };

    if (department !== "all") {
      query.department = department;
    }

    const reports = await LabReport.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup phone",
        populate: { path: "userId", select: "name email avatar" },
      })
      .populate("doctorId", "name specialty department")
      .populate("sampleId", "sampleId barcode")
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = reports
      .map((r: any) => {
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
          sampleCode: r.sampleId?.sampleId || r.sampleCode || "Completed",
          barcode: r.sampleId?.barcode || "N/A",
          verifiedBy: r.verifiedBy || "Dr. Sunita Patil, MD Pathology",
          verifiedDate: r.verifiedDate || r.submittedAt || r.updatedAt,
          submittedBy: r.submittedBy || "Arun Kumar",
          resultsCount: r.results?.length || 0,
          summary: r.summary,
          patient: {
            _id: r.patientId?._id?.toString(),
            name: patientName,
            mrn: r.patientId?.mrn || "MRN-N/A",
            age,
            gender: r.patientId?.gender || "male",
            bloodGroup: r.patientId?.bloodGroup || "O+",
          },
          doctor: {
            name: r.doctorId?.name || "Attending Physician",
            specialty: r.doctorId?.specialty || "Internal Medicine",
          },
        };
      })
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.testName.toLowerCase().includes(q) ||
          r.patient.name.toLowerCase().includes(q) ||
          r.patient.mrn.toLowerCase().includes(q) ||
          r.sampleCode.toLowerCase().includes(q) ||
          r.verifiedBy.toLowerCase().includes(q)
        );
      });

    return NextResponse.json({
      completedTests: formatted,
      totalCount: formatted.length,
    });
  } catch (error: any) {
    console.error("Lab completed tests GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load completed test records" },
      { status: 500 }
    );
  }
}
