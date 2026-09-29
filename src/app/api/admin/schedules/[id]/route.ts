import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { Schedule } from "@/models";
import { logAuditEvent } from "@/lib/audit";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { id } = await params;
    const schedule = await Schedule.findById(id).lean();

    if (!schedule) {
      return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, schedule });
  } catch (error: any) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load schedule" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const { id } = await params;
    const body = await req.json();

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
    }

    if (body.personName) schedule.personName = body.personName.trim();
    if (body.role) schedule.role = body.role.trim();
    if (body.department) schedule.department = body.department.trim();
    if (body.shiftType) schedule.shiftType = body.shiftType;
    if (body.dayOfWeek) schedule.dayOfWeek = body.dayOfWeek;
    if (body.startTime) schedule.startTime = body.startTime.trim();
    if (body.endTime) schedule.endTime = body.endTime.trim();
    if (body.station) schedule.station = body.station.trim();
    if (body.status) schedule.status = body.status;
    if (body.notes !== undefined) schedule.notes = body.notes;

    await schedule.save();

    // Server-side audit log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: "DUTY_SCHEDULE_UPDATED",
      resource: `${schedule.personName} - ${schedule.dayOfWeek} (${schedule.shiftType})`,
      resourceType: "schedule",
      metadata: { updates: body },
    });

    return NextResponse.json({
      success: true,
      schedule,
      message: "Schedule updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const { id } = await params;
    const schedule = await Schedule.findByIdAndDelete(id);

    if (!schedule) {
      return NextResponse.json({ success: false, error: "Schedule not found" }, { status: 404 });
    }

    // Server-side audit log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: "DUTY_SCHEDULE_DELETED",
      resource: `${schedule.personName} - ${schedule.dayOfWeek} (${schedule.shiftType})`,
      resourceType: "schedule",
      metadata: { department: schedule.department, station: schedule.station },
    });

    return NextResponse.json({
      success: true,
      message: "Schedule deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
