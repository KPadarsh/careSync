import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { LabReport } from "@/models/LabReport";

export async function GET() {
  try {
    await connectToDatabase();
    const { patientId } = await requirePatientSession();

    // Show verified / finalized reports belonging to authenticated patient
    const reports = await LabReport.find({
      patientId,
      status: { $in: ["verified", "finalized"] },
    })
      .populate("doctorId", "name specialty department")
      .sort({ verifiedDate: -1, sampleCollectionDate: -1 });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Fetch lab reports error:", error);
    return NextResponse.json({ error: "Failed to fetch lab reports" }, { status: 500 });
  }
}
