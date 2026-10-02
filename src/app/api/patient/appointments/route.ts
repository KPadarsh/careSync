import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { Appointment, Doctor, FollowUp, Notification } from "@/models";
import { NotificationService } from "@/services/notification.service";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { patientId } = await requirePatientSession(req);

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
    const err = error as any;
    const status = err?.statusCode || (err?.message?.includes("Forbidden") ? 403 : err?.message?.includes("Unauthorized") ? 401 : 500);
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: err?.message || "Unauthorized" }, { status });
    }
    console.error("Fetch appointments error:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user, patientId } = await requirePatientSession(req);

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
    if (!doctor || !["active", "ACTIVE"].includes(doctor.status)) {
      return NextResponse.json(
        { error: "Selected doctor is not available" },
        { status: 400 }
      );
    }

    // 2. Validate date is not in the past (timezone-safe comparison)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate: Date;
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-").map(Number);
      checkDate = new Date(year, month - 1, day);
    } else {
      checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
    }

    // Allow today and future dates across all timezones (buffer with yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    if (checkDate < yesterday) {
      return NextResponse.json(
        { error: "Appointments cannot be scheduled in the past" },
        { status: 400 }
      );
    }

    const appointmentDate = checkDate;

    // 3. Server-side availability check
    const startOfTargetDay = new Date(checkDate);
    startOfTargetDay.setHours(0, 0, 0, 0);
    const endOfTargetDay = new Date(checkDate);
    endOfTargetDay.setHours(23, 59, 59, 999);

    const existingBooking = await Appointment.findOne({
      doctorId: new Types.ObjectId(doctorId),
      date: {
        $gte: startOfTargetDay,
        $lte: endOfTargetDay,
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

    // 6. Realtime workflow notifications via NotificationService
    // 6a. Notify Receptionist portal
    try {
      await NotificationService.notifyRole("RECEPTIONIST", {
        title: "New Appointment Booked",
        message: `Patient ${user.name} booked an appointment for Dr. ${doctor.name} on ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
        type: "appointment",
        link: "/reception/appointments",
        relatedResource: {
          resourceType: "appointment",
          resourceId: appointment._id.toString(),
        },
      });
    } catch (err) {
      console.error("Failed to notify receptionists:", err);
    }

    // 6b. Notify Doctor if linked user account exists
    if (doctor.userId) {
      try {
        await NotificationService.createNotification({
          recipientUserId: doctor.userId,
          title: "New Appointment Scheduled",
          message: `Patient ${user.name} scheduled an appointment with you on ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
          type: "appointment",
          link: "/doctor/queue",
          relatedResource: {
            resourceType: "appointment",
            resourceId: appointment._id.toString(),
          },
        });
      } catch (err) {
        console.error("Failed to notify doctor:", err);
      }
    }

    // 6c. Notify Patient
    try {
      await NotificationService.createNotification({
        recipientUserId: user._id,
        title: "Appointment Booked",
        message: `Your appointment with Dr. ${doctor.name} on ${new Date(date).toLocaleDateString()} at ${timeSlot} is confirmed.`,
        type: "appointment",
        link: "/patient/appointments",
        relatedResource: {
          resourceType: "appointment",
          resourceId: appointment._id.toString(),
        },
      });
    } catch (err) {
      console.error("Failed to notify patient:", err);
    }

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
    const err = error as any;
    const status = err?.statusCode || (err?.message?.includes("Forbidden") ? 403 : err?.message?.includes("Unauthorized") ? 401 : 500);
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: err?.message || "Unauthorized" }, { status });
    }
    console.error("Book appointment error:", error);
    return NextResponse.json({ error: "Failed to book appointment" }, { status: 500 });
  }
}
