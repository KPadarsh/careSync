import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession } from "@/lib/auth";
import { LabSample, Patient, LabReport } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabTechSession();

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, collected, processing, stored, pending
    const search = searchParams.get("search")?.trim().toLowerCase();

    const query: any = {};
    if (filter !== "all") {
      query.status = filter;
    }

    const samples = await LabSample.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup phone allergies",
        populate: { path: "userId", select: "name email avatar" },
      })
      .populate("labReportId", "testName department priority status")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = samples
      .map((s: any) => {
        const patientName =
          s.patientId?.userId?.name ||
          `${s.patientId?.firstName || ""} ${s.patientId?.lastName || ""}`.trim() ||
          "Patient";

        const age = s.patientId?.dateOfBirth
          ? Math.floor(
              (Date.now() - new Date(s.patientId.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 34;

        return {
          _id: s._id.toString(),
          sampleId: s.sampleId,
          barcode: s.barcode,
          testName: s.testName,
          sampleType: s.sampleType,
          containerType: s.containerType,
          collectionVolume: s.collectionVolume,
          collectedBy: s.collectedBy,
          collectedAt: s.collectedAt,
          status: s.status,
          storageLocation: s.storageLocation,
          notes: s.notes || "",
          priority: s.labReportId?.priority || "routine",
          reportStatus: s.labReportId?.status || s.status,
          reportId: s.labReportId?._id?.toString(),
          patient: {
            _id: s.patientId?._id?.toString(),
            name: patientName,
            mrn: s.patientId?.mrn || "MRN-N/A",
            age,
            gender: s.patientId?.gender || "male",
            bloodGroup: s.patientId?.bloodGroup || "O+",
          },
        };
      })
      .filter((s) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.sampleId.toLowerCase().includes(q) ||
          s.barcode.toLowerCase().includes(q) ||
          s.testName.toLowerCase().includes(q) ||
          s.patient.name.toLowerCase().includes(q) ||
          s.patient.mrn.toLowerCase().includes(q) ||
          s.storageLocation.toLowerCase().includes(q)
        );
      });

    const counts = {
      all: formatted.length,
      collected: formatted.filter((s) => s.status === "collected").length,
      processing: formatted.filter((s) => s.status === "processing").length,
      stored: formatted.filter((s) => s.status === "stored").length,
      pending: formatted.filter((s) => s.status === "pending").length,
    };

    return NextResponse.json({
      samples: formatted,
      counts,
    });
  } catch (error: any) {
    console.error("Lab samples GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load laboratory samples" },
      { status: 500 }
    );
  }
}
