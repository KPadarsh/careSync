import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { Schedule, Staff, Doctor } from "@/models";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const dayOfWeek = searchParams.get("dayOfWeek") || "";
    const shiftType = searchParams.get("shiftType") || "";
    const department = searchParams.get("department") || "";
    const personType = searchParams.get("personType") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search")?.trim().toLowerCase() || "";

    const query: any = {};

    if (dayOfWeek && dayOfWeek !== "all") query.dayOfWeek = dayOfWeek;
    if (shiftType && shiftType !== "all") query.shiftType = shiftType;
    if (department && department !== "all") query.department = department;
    if (personType && personType !== "all") query.personType = personType;
    if (status && status !== "all") query.status = status;

    if (search) {
      query.$or = [
        { personName: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { station: { $regex: search, $options: "i" } },
      ];
    }

    // STRICT: This is duty shift roster management, NOT patient appointments
    const schedules = await Schedule.find(query).sort({ dayOfWeek: 1, startTime: 1 }).lean();

    return NextResponse.json({
      success: true,
      schedules,
      total: schedules.length,
    });
  } catch (error: any) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load duty schedules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const body = await req.json();
    const {
      personName,
      personType,
      role,
      department,
      shiftType,
      dayOfWeek,
      startTime,
      endTime,
      station,
      notes,
    } = body;

    if (!personName || !role || !department || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "Person name, role, department, day, and hours are required." },
        { status: 400 }
      );
    }

    const schedule = await Schedule.create({
      personName: personName.trim(),
      personType: personType || "staff",
      role: role.trim(),
      department: department.trim(),
      shiftType: shiftType || "morning",
      dayOfWeek,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      station: station?.trim() || "Main Facility Desk",
      status: "scheduled",
      notes: notes || "",
    });

    // Server-side audit log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: "DUTY_SCHEDULE_CREATED",
      resource: `${personName} - ${dayOfWeek} (${shiftType})`,
      resourceType: "schedule",
      metadata: { department, station, startTime, endTime },
    });

    return NextResponse.json({
      success: true,
      schedule,
      message: "Shift schedule assigned successfully",
    });
  } catch (error: any) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to assign shift schedule" },
      { status: 500 }
    );
  }
}
