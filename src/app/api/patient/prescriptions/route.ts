import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { Prescription } from "@/models/Prescription";

export async function GET() {
  try {
    await connectToDatabase();
    const { patientId } = await requirePatientSession();

    // Read-only for patient
    const prescriptions = await Prescription.find({ patientId })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .sort({ date: -1 });

    const active = prescriptions.filter((p) => p.status === "active");
    const completed = prescriptions.filter((p) => p.status !== "active");

    return NextResponse.json({
      success: true,
      prescriptions,
      active,
      completed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Fetch prescriptions error:", error);
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }
}
