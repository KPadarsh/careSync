import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession, hashPassword, verifyPassword } from "@/lib/auth";
import { Doctor, User } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctor = session.doctor;
    const user = session.user;

    return NextResponse.json({
      doctor: {
        _id: doctor._id.toString(),
        name: doctor.name,
        specialty: doctor.specialty,
        department: doctor.department,
        qualification: doctor.qualification,
        roomNumber: doctor.roomNumber,
        avatar: user.avatar || doctor.avatar,
        email: user.email,
        phone: user.phone || "+1 (555) 018-4921",
        workingHours: doctor.workingHours,
        availableDays: doctor.availableDays,
        slotDurationMinutes: doctor.slotDurationMinutes,
        status: doctor.status,
      },
    });
  } catch (error: any) {
    console.error("Doctor profile GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctor profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctor = await Doctor.findById(session.doctor._id);
    const user = await User.findById(session.user._id);

    if (!doctor || !user) {
      return NextResponse.json({ error: "Doctor or user not found" }, { status: 404 });
    }

    const body = await request.json();
    const { phone, avatar, qualification, roomNumber, currentPassword, newPassword } = body;

    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) {
      user.avatar = avatar;
      doctor.avatar = avatar;
    }
    if (qualification !== undefined) doctor.qualification = qualification;
    if (roomNumber !== undefined) doctor.roomNumber = roomNumber;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set new password" },
          { status: 400 }
        );
      }
      const isValid = verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password does not match" },
          { status: 400 }
        );
      }
      user.passwordHash = hashPassword(newPassword);
    }

    await user.save();
    await doctor.save();

    return NextResponse.json({
      success: true,
      message: "Doctor profile updated successfully",
      doctor: {
        _id: doctor._id.toString(),
        name: doctor.name,
        specialty: doctor.specialty,
        qualification: doctor.qualification,
        roomNumber: doctor.roomNumber,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error("Doctor profile PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
