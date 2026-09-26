import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession, hashPassword, verifyPassword } from "@/lib/auth";
import { User } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requireLabTechSession();
    const user = session.user;

    return NextResponse.json({
      technician: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone || "+1 (555) 019-3829",
        role: user.role,
        avatar: user.avatar,
        station: session.station || "Diagnostic Station A-4",
        department: "Clinical Pathology & Diagnostic Hematology",
        certifications: "ASCP Certified Medical Laboratory Technician (MLT)",
        shiftHours: "07:00 AM – 03:30 PM (Morning Run)",
        status: "On Duty",
      },
    });
  } catch (error: any) {
    console.error("Lab profile GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load technician profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireLabTechSession();
    const user = await User.findById(session.user._id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { phone, avatar, currentPassword, newPassword } = body;

    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;

    if (currentPassword && newPassword) {
      const isMatch = verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Incorrect current password" },
          { status: 400 }
        );
      }
      user.passwordHash = hashPassword(newPassword);
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Technician profile updated successfully",
      technician: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error("Lab profile PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
