import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Patient } from "@/models/Patient";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.PATIENT,
      phone: phone?.trim() || "",
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
      status: "active",
    });

    // Generate MRN for patient
    const count = await Patient.countDocuments();
    const mrn = `MRN-${2026}-${String(count + 1).padStart(5, "0")}`;

    const patient = await Patient.create({
      userId: user._id,
      mrn,
      dateOfBirth: new Date("1995-01-01"),
      gender: "other",
      bloodGroup: "O+",
      phone: phone?.trim() || "+1 (555) 000-0000",
      emergencyContact: {
        name: "Emergency Contact",
        relationship: "Family",
        phone: "+1 (555) 000-0000",
      },
    });

    await setSessionCookie({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      patientId: patient._id.toString(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      patientId: patient._id.toString(),
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
