import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { User, AuditLog, Staff, Doctor, Department } from "@/models";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const [staffCount, doctorCount, departmentCount, auditCount] = await Promise.all([
      Staff.countDocuments(),
      Doctor.countDocuments(),
      Department.countDocuments(),
      AuditLog.countDocuments({ "actor.email": session.user.email }),
    ]);

    return NextResponse.json({
      success: true,
      profile: {
        name: session.user.name,
        email: session.user.email,
        role: "System Administrator",
        phone: session.user.phone || "+1 (555) 901-2244",
        department: "Executive Administration & Operations",
        station: "Central Hospital Admin Suite 500",
        badgeId: "ADM-001",
        joinedDate: session.user.createdAt,
        systemMetrics: {
          staffManaged: staffCount,
          doctorsManaged: doctorCount,
          departmentsManaged: departmentCount,
          auditActionsLogged: auditCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching admin profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load admin profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const body = await req.json();
    const { name, phone } = body;

    const user = await User.findById(session.user._id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    await user.save();

    await logAuditEvent({
      actor: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      action: "ADMIN_PROFILE_UPDATED",
      resource: "Administrator Profile",
      resourceType: "user",
      metadata: { updates: body },
    });

    return NextResponse.json({
      success: true,
      message: "Admin profile updated successfully",
      user: { name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error: any) {
    console.error("Error updating admin profile:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
