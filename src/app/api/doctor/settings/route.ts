import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import { Doctor } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctor = session.doctor;

    return NextResponse.json({
      settings: {
        slotDurationMinutes: doctor.slotDurationMinutes || 30,
        roomNumber: doctor.roomNumber || "Consultation Room 302",
        autoAdvanceQueue: true,
        notifyUrgentTriage: true,
        soundAlerts: true,
        defaultCardioTemplate: true,
        allergyWarningStrict: true,
      },
    });
  } catch (error: any) {
    console.error("Doctor settings GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctor settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctor = await Doctor.findById(session.doctor._id);

    if (!doctor) {
      return NextResponse.json({ error: "Doctor record not found" }, { status: 404 });
    }

    const body = await request.json();
    const { slotDurationMinutes, roomNumber } = body;

    if (slotDurationMinutes) doctor.slotDurationMinutes = Number(slotDurationMinutes);
    if (roomNumber) doctor.roomNumber = roomNumber.trim();

    await doctor.save();

    return NextResponse.json({
      success: true,
      message: "Doctor clinical preferences updated successfully",
      settings: {
        slotDurationMinutes: doctor.slotDurationMinutes,
        roomNumber: doctor.roomNumber,
      },
    });
  } catch (error: any) {
    console.error("Doctor settings PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
