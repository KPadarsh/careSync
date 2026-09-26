import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Doctor } from "@/models/Doctor";

export async function GET() {
  try {
    await connectToDatabase();
    const doctors = await Doctor.find({ status: "active" }).select(
      "name specialty department qualification roomNumber avatar availableDays workingHours slotDurationMinutes"
    );

    const departments = Array.from(new Set(doctors.map((d) => d.department)));

    return NextResponse.json({
      success: true,
      doctors,
      departments,
    });
  } catch (error) {
    console.error("Fetch doctors error:", error);
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}
