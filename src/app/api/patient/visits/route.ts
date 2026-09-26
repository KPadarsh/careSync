import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { Visit } from "@/models/Visit";

export async function GET() {
  try {
    await connectToDatabase();
    const { patientId } = await requirePatientSession();

    // Security Rule: Select only patient-facing fields. Exclude internalNotes!
    const visits = await Visit.find({ patientId })
      .select("visitDate reason diagnosis summary status vitals doctorId createdAt")
      .populate("doctorId", "name specialty department roomNumber avatar")
      .sort({ visitDate: -1 });

    return NextResponse.json({
      success: true,
      visits,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Fetch visits error:", error);
    return NextResponse.json({ error: "Failed to fetch visits" }, { status: 500 });
  }
}
