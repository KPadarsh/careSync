import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { Doctor, User } from "@/models";
import { logAuditEvent } from "@/lib/audit";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { id } = await params;
    const doctor = await Doctor.findById(id).populate("userId", "email status role").lean();

    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, doctor });
  } catch (error: any) {
    console.error("Error fetching doctor:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load doctor profile" },
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

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    const previousStatus = doctor.status;
    const previousDepartment = doctor.department;

    if (body.name) doctor.name = body.name.trim();
    if (body.specialty) doctor.specialty = body.specialty.trim();
    if (body.department) doctor.department = body.department.trim();
    if (body.qualification) doctor.qualification = body.qualification.trim();
    if (body.roomNumber) doctor.roomNumber = body.roomNumber.trim();
    if (body.availableDays) doctor.availableDays = body.availableDays;
    if (body.workingHours) doctor.workingHours = body.workingHours;
    if (body.slotDurationMinutes) doctor.slotDurationMinutes = Number(body.slotDurationMinutes);
    if (body.status) doctor.status = body.status;

    await doctor.save();

    if (body.status && doctor.userId) {
      await User.findByIdAndUpdate(doctor.userId, {
        status: body.status === "active" ? "active" : "inactive",
      });
    }

    // Server-side audit log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: body.status && body.status !== previousStatus ? "DOCTOR_STATUS_CHANGED" : "DOCTOR_UPDATED",
      resource: `${doctor.name} (${doctor.specialty})`,
      resourceType: "doctor",
      metadata: {
        previousStatus,
        newStatus: doctor.status,
        previousDepartment,
        newDepartment: doctor.department,
        updates: body,
      },
    });

    return NextResponse.json({
      success: true,
      doctor,
      message: "Doctor profile updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating doctor:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update doctor" },
      { status: 500 }
    );
  }
}
