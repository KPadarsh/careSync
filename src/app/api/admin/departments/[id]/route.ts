import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { Department, Doctor, Staff } from "@/models";
import { logAuditEvent } from "@/lib/audit";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { id } = await params;
    const department = await Department.findById(id).lean();

    if (!department) {
      return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 });
    }

    // Fetch assigned doctors and staff for this department
    const [assignedDoctors, assignedStaff] = await Promise.all([
      Doctor.find({
        department: { $regex: new RegExp(`^${department.name}$`, "i") },
      })
        .select("name specialty roomNumber status availableDays workingHours")
        .lean(),
      Staff.find({
        department: { $regex: new RegExp(`^${department.name}$`, "i") },
      })
        .select("employeeId fullName role designation shift status phone email")
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      department: {
        ...department,
        assignedDoctors,
        assignedStaff,
      },
    });
  } catch (error: any) {
    console.error("Error fetching department details:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load department" },
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

    const department = await Department.findById(id);
    if (!department) {
      return NextResponse.json({ success: false, error: "Department not found" }, { status: 404 });
    }

    const previousStatus = department.status;

    if (body.name) department.name = body.name.trim();
    if (body.code) department.code = body.code.toUpperCase().trim();
    if (body.description !== undefined) department.description = body.description;
    if (body.headOfDepartment !== undefined) department.headOfDepartment = body.headOfDepartment;
    if (body.location) department.location = body.location;
    if (body.phone !== undefined) department.phone = body.phone;
    if (body.email !== undefined) department.email = body.email;
    if (body.operatingHours) department.operatingHours = body.operatingHours;
    if (body.status) department.status = body.status;

    await department.save();

    // Server-side audit log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: body.status && body.status !== previousStatus ? "DEPARTMENT_STATUS_CHANGED" : "DEPARTMENT_UPDATED",
      resource: `${department.name} (${department.code})`,
      resourceType: "department",
      metadata: { updates: body },
    });

    return NextResponse.json({
      success: true,
      department,
      message: "Department updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update department" },
      { status: 500 }
    );
  }
}
