import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { Staff, User } from "@/models";
import { logAuditEvent } from "@/lib/audit";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { id } = await params;
    const staff = await Staff.findById(id).populate("userId", "email status role").lean();

    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, staff });
  } catch (error: any) {
    console.error("Error fetching staff member:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load staff details" },
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

    const staff = await Staff.findById(id);
    if (!staff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    const previousStatus = staff.status;
    const previousDepartment = staff.department;

    if (body.fullName) staff.fullName = body.fullName.trim();
    if (body.phone) staff.phone = body.phone.trim();
    if (body.role) staff.role = body.role;
    if (body.department) staff.department = body.department.trim();
    if (body.designation) staff.designation = body.designation.trim();
    if (body.shift) staff.shift = body.shift;
    if (body.status) staff.status = body.status;
    if (body.emergencyContact !== undefined) staff.emergencyContact = body.emergencyContact;
    if (body.qualifications !== undefined) staff.qualifications = body.qualifications;
    if (body.notes !== undefined) staff.notes = body.notes;

    await staff.save();

    // If status changed to inactive, update linked user if exists
    if (body.status && staff.userId) {
      await User.findByIdAndUpdate(staff.userId, {
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
      action: body.status && body.status !== previousStatus ? "STAFF_STATUS_CHANGED" : "STAFF_UPDATED",
      resource: `${staff.fullName} (${staff.employeeId})`,
      resourceType: "staff",
      metadata: {
        previousStatus,
        newStatus: staff.status,
        previousDepartment,
        newDepartment: staff.department,
        updates: body,
      },
    });

    return NextResponse.json({
      success: true,
      staff,
      message: "Staff member updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating staff member:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update staff member" },
      { status: 500 }
    );
  }
}
