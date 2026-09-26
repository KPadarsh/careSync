import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Patient } from "@/models/Patient";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || user.status !== "active") {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    let patientId: string | undefined;
    if (user.role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ userId: user._id });
      patientId = patient?._id?.toString();
    }

    await setSessionCookie({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      patientId,
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
      patientId,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
