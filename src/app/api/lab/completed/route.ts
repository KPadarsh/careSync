import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";
import { LabReport, Patient, Doctor } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabSession();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("status")?.toLowerCase() || "all";
    const department = searchParams.get("department")?.toLowerCase() || "all";
    const search = searchParams.get("search")?.trim().toLowerCase();

    const query: any = {
      status: {
        $in: ["submitted_for_review", "verified", "finalized"],
      },
    };

    if (filter === "submitted") {
      query.status = "submitted_for_review";
    } else if (filter === "verified") {
      query.status = "verified";
    } else if (filter === "finalized") {
      query.status = "finalized";
    }

    if (department && department !== "all") {
      query.department = { $regex: new RegExp(department, "i") };
    }

    const reports = await LabReport.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup",
        populate: { path: "userId", select: "name avatar" },
      })
      .populate("doctorId", "name specialty")
      .populate("sampleDocId")
      .sort({ updatedAt: -1, submittedForReviewAt: -1, verifiedDate: -1 })
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
          : 35;

        return {
          _id: r._id.toString(),
          testName: r.testName,
          department: r.department,
          priority: r.priority || "routine",
          status: r.status,
          sampleId: r.sampleId || "SMP-COMPLETED",
          sampleType: r.sampleType || "Specimen",
          barcode: r.barcode,
          requestedDate: r.createdAt || r.sampleCollectionDate,
          submittedForReviewAt: r.submittedForReviewAt,
          submittedBy: r.submittedBy || "Lab Technician",
          verifiedDate: r.verifiedDate,
          verifiedBy: r.verifiedBy,
          summary: r.summary,
          technicianNotes: r.technicianNotes,
          pathologistNotes: r.pathologistNotes,
          resultsCount: r.results?.length || 0,
          results: r.results || [],
          patient: {
            _id: r.patientId?._id?.toString(),
            name: patientName,
            mrn: r.patientId?.mrn || "MRN-N/A",
            age,
            gender: r.patientId?.gender || "unknown",
            bloodGroup: r.patientId?.bloodGroup || "—",
            avatar: r.patientId?.userId?.avatar,
          },
          doctor: {
            _id: r.doctorId?._id?.toString(),
            name: r.doctorId?.name || "Ordering Physician",
            specialty: r.doctorId?.specialty || "Internal Medicine",
          },
        };
      })
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          r.testName.toLowerCase().includes(q) ||
          r.sampleId.toLowerCase().includes(q) ||
          r.patient.name.toLowerCase().includes(q) ||
          r.patient.mrn.toLowerCase().includes(q) ||
          r.doctor.name.toLowerCase().includes(q) ||
          (r.verifiedBy && r.verifiedBy.toLowerCase().includes(q))
        );
      });

    return NextResponse.json({ reports: formatted });
  } catch (error: any) {
    console.error("Lab Completed GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load completed lab reports" },
      { status: 500 }
    );
  }
}
