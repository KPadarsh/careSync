import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { User, Staff, Doctor } from "@/models";
import { logAuditEvent } from "@/lib/audit";
import { ROLES, Role } from "@/lib/constants";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { id } = await params;
    const user = await User.findById(id).select("-passwordHash").lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check if user has associated Staff or Doctor profile
    const [staffProfile, doctorProfile] = await Promise.all([
      Staff.findOne({ userId: user._id }).lean(),
      Doctor.findOne({ userId: user._id }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        staffProfile,
        doctorProfile,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load user details" },
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

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Security Checks:
    // 1. Prevent self-deactivation by the currently logged-in administrator
    if (body.status === "inactive" && session.user._id.toString() === targetUser._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Security restriction: You cannot deactivate your own active administrator account." },
        { status: 400 }
      );
    }

    // 2. Prevent removing the last active administrator
    if (
      (body.status === "inactive" || (body.role && body.role !== ROLES.ADMIN)) &&
      targetUser.role === ROLES.ADMIN
    ) {
      const activeAdminCount = await User.countDocuments({
        role: ROLES.ADMIN,
        status: "active",
      });
      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { success: false, error: "Security restriction: Cannot modify the sole remaining active administrator." },
          { status: 400 }
        );
      }
    }

    // 3. Validate role
    if (body.role) {
      const validRoles = Object.values(ROLES);
      if (!(validRoles as string[]).includes(body.role)) {
        return NextResponse.json(
          { success: false, error: `Invalid role specified.` },
          { status: 400 }
        );
      }
    }

    const previousRole = targetUser.role;
    const previousStatus = targetUser.status;

    if (body.name) targetUser.name = body.name.trim();
    if (body.phone !== undefined) targetUser.phone = body.phone.trim();
    if (body.role) targetUser.role = body.role;
    if (body.status) targetUser.status = body.status;

    await targetUser.save();

    // If status changed, synchronize linked staff or doctor status
    if (body.status) {
      await Promise.all([
        Staff.findOneAndUpdate({ userId: targetUser._id }, { status: body.status }),
        Doctor.findOneAndUpdate({ userId: targetUser._id }, { status: body.status }),
      ]);
    }

    // Server-side audit log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action:
        body.role && body.role !== previousRole
          ? "USER_ROLE_CHANGED"
          : body.status && body.status !== previousStatus
          ? "USER_STATUS_CHANGED"
          : "USER_UPDATED",
      resource: `${targetUser.name} (${targetUser.email})`,
      resourceType: "user",
      metadata: {
        previousRole,
        newRole: targetUser.role,
        previousStatus,
        newStatus: targetUser.status,
        updates: body,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status,
      },
      message: "User account updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
