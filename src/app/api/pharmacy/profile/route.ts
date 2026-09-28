import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { User, DispensingRecord } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePharmacySession();
    await connectToDatabase();

    const user = await User.findById(session.user._id).select("-passwordHash").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const dispensedLifetime = await DispensingRecord.countDocuments({
      status: "completed",
    });

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        licenseNumber: "RPH-948201-NY",
        designation: "Registered Lead Pharmacist (RPh)",
        department: "Central Dispensary & Ambulatory Pharmacy",
        shift: "Morning & Afternoon (08:00 AM - 04:30 PM)",
        specializations: ["Pharmacotherapy", "Medication Therapy Management (MTM)", "Chemotherapy Admixture"],
        stats: {
          dispensedLifetime,
          activeSupervisions: 4,
          satisfactionRate: "99.4%",
        },
      },
    });
  } catch (error: any) {
    console.error("Pharmacy profile GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch pharmacy profile" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requirePharmacySession();
    await connectToDatabase();

    const body = await req.json();
    const { name, phone, avatar } = body;

    const user = await User.findById(session.user._id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();
    if (avatar) user.avatar = avatar.trim();

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    console.error("Pharmacy profile PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}
