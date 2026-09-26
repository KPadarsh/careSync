import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { FollowUp } from "@/models/FollowUp";

export async function GET() {
  try {
    await connectToDatabase();
    const { patientId } = await requirePatientSession();

    // Patient cannot modify clinical instructions (read-only for patient)
    const followUps = await FollowUp.find({ patientId })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .populate("scheduledAppointmentId", "date timeSlot status")
      .sort({ recommendedDate: 1 });

    const pending = followUps.filter((f) => f.status === "pending");
    const scheduled = followUps.filter((f) => f.status === "scheduled");

    return NextResponse.json({
      success: true,
      followUps,
      pending,
      scheduled,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Fetch follow-ups error:", error);
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  }
}
