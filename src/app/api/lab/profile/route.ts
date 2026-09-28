import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";
import { User } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireLabSession();
    const user = session.user;

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || "+1 (555) 019-3388",
        avatar: user.avatar,
        station: "Central Diagnostic Lab • Station 2",
        certification: "MLT (ASCP) • Senior Medical Laboratory Technologist",
        licenseNumber: "MLT-89241-NY",
        shift: "Morning Analytical Shift (08:00 - 16:30)",
        department: "Clinical Pathology & Biochemistry",
      },
    });
  } catch (error: any) {
    console.error("Lab Profile GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load technician profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireLabSession();
    const user = await User.findById(session.user._id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    if (body.name) user.name = body.name.trim();
    if (body.phone) user.phone = body.phone.trim();
    if (body.avatar) user.avatar = body.avatar.trim();

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Technician profile updated successfully.",
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error("Lab Profile PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
