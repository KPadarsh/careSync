import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession, hashPassword, verifyPassword } from "@/lib/auth";
import { User } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requireNurseSession();

    return NextResponse.json({
      user: {
        _id: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.role,
        phone: session.user.phone || "+1 (555) 018-4721",
        avatar: session.user.avatar || "https://images.unsplash.com/photo-1594824813689-53b65287f329?auto=format&fit=crop&w=200&q=80",
        licenseNumber: "RN-89421-CA",
        department: "Triage & Emergency Preparedness",
        shift: "Morning Shift (08:00 - 16:30)",
        station: "Station 3A - Main Clinical Wing",
      },
    });
  } catch (error: any) {
    console.error("Nurse profile GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load profile" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const session = await requireNurseSession();

    const body = await request.json();
    const { name, phone, currentPassword, newPassword } = body;

    const user = await User.findById(session.user._id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password required to set a new password" }, { status: 400 });
      }
      const isMatch = verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }
      user.passwordHash = hashPassword(newPassword);
    }

    await user.save();

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error("Nurse profile PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
