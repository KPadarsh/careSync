import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession, hashPassword } from "@/lib/auth";
import { Doctor, User } from "@/models";
import { logAuditEvent } from "@/lib/audit";
import { ROLES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const department = searchParams.get("department") || "";
    const specialty = searchParams.get("specialty") || "";
    const status = searchParams.get("status") || "";

    const query: any = {};

    if (department && department !== "all") query.department = department;
    if (specialty && specialty !== "all") query.specialty = specialty;
    if (status && status !== "all") query.status = status;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { specialty: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { roomNumber: { $regex: search, $options: "i" } },
      ];
    }

    // STRICT: Admin does NOT query clinical appointments or consultations here. Only doctor profiles.
    const doctors = await Doctor.find(query).sort({ name: 1 }).lean();

    return NextResponse.json({
      success: true,
      doctors,
      total: doctors.length,
    });
  } catch (error: any) {
    console.error("Error fetching doctors for admin:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load doctors" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const body = await req.json();
    const {
      name,
      email,
      specialty,
      department,
      qualification,
      roomNumber,
      availableDays,
      workingHours,
      slotDurationMinutes,
    } = body;

    if (!name || !specialty || !department) {
      return NextResponse.json(
        { success: false, error: "Doctor name, specialty, and department are required." },
        { status: 400 }
      );
    }

    let userId: any = undefined;
    if (email) {
      let existingUser = await User.findOne({ email: email.toLowerCase() });
      if (!existingUser) {
        existingUser = await User.create({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          passwordHash: hashPassword(body.password || "Doctor123!"),
          role: ROLES.DOCTOR,
          status: "active",
        });
      }
      userId = existingUser._id;
    }

    const doctor: any = await Doctor.create({
      ...(userId ? { userId } : {}),
      name: name.trim(),
      specialty: specialty.trim(),
      department: department.trim(),
      qualification: qualification?.trim() || "MD, MBBS",
      roomNumber: roomNumber?.trim() || "Consultation Room",
      availableDays: availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: workingHours || { start: "09:00 AM", end: "05:00 PM" },
      slotDurationMinutes: Number(slotDurationMinutes) || 30,
      status: "active",
    });

    // Server-side audit log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: "DOCTOR_CREATED",
      resource: `${doctor.name || name} (${doctor.specialty || specialty})`,
      resourceType: "doctor",
      metadata: { department, specialty, roomNumber },
    });

    return NextResponse.json({
      success: true,
      doctor,
      message: "Doctor created successfully",
    });
  } catch (error: any) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create doctor" },
      { status: 500 }
    );
  }
}
