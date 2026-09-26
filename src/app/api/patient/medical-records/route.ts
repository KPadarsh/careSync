import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { MedicalRecord } from "@/models/MedicalRecord";

export async function GET() {
  try {
    await connectToDatabase();
    const { patientId } = await requirePatientSession();

    // Do not expose staff-only records (isStaffOnly: false)
    const records = await MedicalRecord.find({
      patientId,
      isStaffOnly: false,
    })
      .select("title category recordDate facility summary fileUrl doctorId createdAt")
      .populate("doctorId", "name specialty department")
      .sort({ recordDate: -1 });

    return NextResponse.json({
      success: true,
      records,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Fetch medical records error:", error);
    return NextResponse.json({ error: "Failed to fetch medical records" }, { status: 500 });
  }
}
