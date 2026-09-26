import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { Appointment, Doctor, FollowUp, Notification } from "@/models";
import { Types } from "mongoose";

export async function GET() {
  try {
    await connectToDatabase();
    const { patientId } = await requirePatientSession();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({ patientId })
      .populate("doctorId", "name specialty department qualification roomNumber avatar")
      .sort({ date: -1, timeSlot: 1 });

    const upcoming = appointments
      .filter((a) => new Date(a.date) >= today && a.status !== "cancelled")
      .reverse();

    const past = appointments.filter(
      (a) => new Date(a.date) < today || a.status === "cancelled" || a.status === "completed"
    );

    return NextResponse.json({
      success: true,
      upcoming,
      past,
      all: appointments,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Fetch appointments error:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user, patientId } = await requirePatientSession();

    const body = await req.json();
    const { doctorId, date, timeSlot, type = "in-person", reason, followUpId } = body;

    if (!doctorId || !date || !timeSlot || !reason) {
      return NextResponse.json(
        { error: "Doctor, date, time slot, and reason are required" },
        { status: 400 }
      );
    }

    // 1. Verify Doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.status !== "active") {
      return NextResponse.json(
        { error: "Selected doctor is not available" },
        { status: 400 }
      );
    }

    // 2. Validate date is not in the past
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(appointmentDate);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) {
      return NextResponse.json(
        { error: "Appointments cannot be scheduled in the past" },
        { status: 400 }
      );
    }

    // 3. Server-side availability check
    const existingBooking = await Appointment.findOne({
      doctorId: new Types.ObjectId(doctorId),
      date: {
        $gte: new Date(checkDate.setHours(0, 0, 0, 0)),
        $lt: new Date(checkDate.setHours(23, 59, 59, 999)),
      },
      timeSlot,
      status: { $in: ["confirmed", "scheduled", "in-progress"] },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "The selected doctor already has a booked appointment at this time slot. Please choose another slot." },
        { status: 409 }
      );
    }

    // 4. Create appointment with bookedBy: 'PATIENT'
    const appointment = await Appointment.create({
      patientId: new Types.ObjectId(patientId),
      doctorId: doctor._id,
      date: appointmentDate,
      timeSlot,
      type,
      reason: reason.trim(),
      status: "confirmed",
      bookedBy: "PATIENT",
      notes: "Booked directly via CareSync Patient Portal",
    });

    // 5. If this was booked for a follow-up, mark it scheduled
    if (followUpId) {
      await FollowUp.findOneAndUpdate(
        { _id: followUpId, patientId },
        { status: "scheduled", scheduledAppointmentId: appointment._id }
      );
    }

    // 6. Create patient notification
    await Notification.create({
      recipientId: user._id,
      title: "Appointment Booked",
      message: `Your appointment with ${doctor.name} on ${new Date(date).toLocaleDateString()} at ${timeSlot} is confirmed.`,
      type: "appointment",
      link: "/patient/appointments",
      isRead: false,
    });

    const populatedAppointment = await Appointment.findById(appointment._id).populate(
      "doctorId",
      "name specialty department roomNumber avatar"
    );

    return NextResponse.json({
      success: true,
      message: "Appointment booked successfully",
      appointment: populatedAppointment,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Book appointment error:", error);
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
