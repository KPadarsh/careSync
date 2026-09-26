import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession, hashPassword, verifyPassword } from "@/lib/auth";
import { User } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const { user } = await requireReceptionSession();

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "+1 (555) 019-2834",
        avatar: user.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
        role: user.role,
        employeeId: "EMP-REC-2024-08",
        designation: "Front Desk Lead / Receptionist Level 2",
        department: "Patient Access & Outpatient Services",
        terminal: "Station 01 (Main Lobby)",
        shift: "Morning Shift (07:30 AM - 04:00 PM)",
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user } = await requireReceptionSession();

    const body = await req.json();
    const { name, phone, currentPassword, newPassword } = body;

    const updates: Record<string, unknown> = {};

    if (name && typeof name === "string") {
      updates.name = name.trim();
    }
    if (phone && typeof phone === "string") {
      updates.phone = phone.trim();
    }

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        );
      }
      const isMatch = verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Current password does not match records" },
          { status: 400 }
        );
      }
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }
      updates.passwordHash = hashPassword(newPassword);
    }

    // STRICT RBAC: Never allow changing own role from receptionist portal
    delete (updates as Record<string, unknown>).role;
    delete (updates as Record<string, unknown>).email;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updates },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        id: updatedUser!._id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        phone: updatedUser!.phone,
        avatar: updatedUser!.avatar,
        role: updatedUser!.role,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
