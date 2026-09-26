import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { NursingAssessment, Patient } from "@/models";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid record ID format" }, { status: 400 });
    }

    const record = await NursingAssessment.findById(id)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth phone allergies emergencyContact chronicConditions",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .populate("queueId", "ticketNumber department roomNumber")
      .lean();

    if (!record) {
      return NextResponse.json({ error: "Nursing record not found" }, { status: 404 });
    }

    return NextResponse.json({ record });
  } catch (error: any) {
    console.error("Nurse record detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load record" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
