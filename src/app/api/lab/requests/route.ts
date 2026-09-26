import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession } from "@/lib/auth";
import { LabReport, Patient, Doctor } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabTechSession();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, requested, sample-pending, sample-collected, processing, completed
    const priority = searchParams.get("priority") || "all";
    const search = searchParams.get("search")?.trim().toLowerCase();

    const query: any = {};

    if (filter !== "all") {
      if (filter === "completed") {
        query.status = { $in: ["submitted-for-review", "verified", "finalized"] };
      } else {
        query.status = filter;
      }
    }

    if (priority !== "all") {
      query.priority = priority;
    }

    const requests = await LabReport.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup phone allergies",
        populate: { path: "userId", select: "name email avatar phone" },
      })
      .populate("doctorId", "name specialty department")
      .populate("sampleId", "sampleId barcode containerType status storageLocation")
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    const formatted = requests
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
          clinicalReason: r.clinicalReason || "",
          instructions: r.instructions || "",
          sampleCode: r.sampleId?.sampleId || r.sampleCode || "Pending Collection",
          barcode: r.sampleId?.barcode || "N/A",
          sampleType: r.sampleId?.sampleType || "Venous Blood",
          containerType: r.sampleId?.containerType || "EDTA Tube (Purple)",
          collectionDate: r.sampleCollectionDate || r.createdAt,
          createdAt: r.createdAt,
          resultsCount: r.results?.length || 0,
          patient: {
            _id: r.patientId?._id?.toString(),
            name: patientName,
            mrn: r.patientId?.mrn || "MRN-N/A",
            age,
            gender: r.patientId?.gender || "male",
            bloodGroup: r.patientId?.bloodGroup || "O+",
            phone: r.patientId?.phone || "N/A",
            allergies: r.patientId?.allergies || [],
          },
          doctor: {
            name: r.doctorId?.name || "Dr. Medical Staff",
            specialty: r.doctorId?.specialty || "Internal Medicine",
          },
        };
      })
      .filter((r) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          r.patient.name.toLowerCase().includes(s) ||
          r.patient.mrn.toLowerCase().includes(s) ||
          r.testName.toLowerCase().includes(s) ||
          r.sampleCode.toLowerCase().includes(s) ||
          r.doctor.name.toLowerCase().includes(s)
        );
      });

    const counts = {
      all: formatted.length,
      requested: formatted.filter((r) => r.status === "requested").length,
      samplePending: formatted.filter((r) => r.status === "sample-pending").length,
      sampleCollected: formatted.filter((r) => r.status === "sample-collected").length,
      processing: formatted.filter((r) => r.status === "processing").length,
      completed: formatted.filter((r) =>
        ["submitted-for-review", "verified", "finalized"].includes(r.status)
      ).length,
    };

    return NextResponse.json({
      requests: formatted,
      counts,
    });
  } catch (error: any) {
    console.error("Lab requests GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load lab requests" },
      { status: 500 }
    );
  }
}
