import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Doctor } from "@/models/Doctor";
import { Appointment } from "@/models/Appointment";
import { Types } from "mongoose";

const DEFAULT_TIME_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.toLocaleDateString("en-US", { weekday: "long" });

    // Check if doctor works on this day
    const isWorkingDay = doctor.availableDays.includes(dayOfWeek);
    if (!isWorkingDay) {
      return NextResponse.json({
        success: true,
        isWorkingDay: false,
        message: `${doctor.name} is not available on ${dayOfWeek}s`,
        slots: [],
      });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctorId: new Types.ObjectId(id),
      date: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["confirmed", "scheduled", "in-progress"] },
    }).select("timeSlot");

    const bookedSlotsSet = new Set(bookedAppointments.map((a) => a.timeSlot));

    const slots = DEFAULT_TIME_SLOTS.map((slot) => ({
      time: slot,
      available: !bookedSlotsSet.has(slot),
    }));

    return NextResponse.json({
      success: true,
      isWorkingDay: true,
      doctor: {
        id: doctor._id.toString(),
        name: doctor.name,
        specialty: doctor.specialty,
        roomNumber: doctor.roomNumber,
      },
      date: dateStr,
      dayOfWeek,
      slots,
    });
  } catch (error) {
    console.error("Availability error:", error);
    return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 });
  }
}
