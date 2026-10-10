import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { Appointment } from "@/models";
import { NotificationService } from "@/services/notification.service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user, patientId } = await requirePatientSession();
    const { id } = await params;

    const body = await req.json();
    const { date, timeSlot, reason } = body;

    if (!date || !timeSlot) {
      return NextResponse.json(
        { error: "New date and time slot are required" },
        { status: 400 }
      );
    }

    const appointment = await Appointment.findOne({
      _id: id,
      patientId,
    }).populate("doctorId", "name userId");

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found or unauthorized" },
        { status: 404 }
      );
    }

    // Server-side availability check
    const newDate = new Date(date);
    const startOfDay = new Date(newDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(newDate);
    endOfDay.setHours(23, 59, 59, 999);

    const conflictingBooking = await Appointment.findOne({
      _id: { $ne: appointment._id },
      doctorId: appointment.doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot,
      status: { $in: ["confirmed", "scheduled", "in-progress"] },
    });

    if (conflictingBooking) {
      return NextResponse.json(
        { error: "Doctor is unavailable at this new time slot. Please select another slot." },
        { status: 409 }
      );
    }

    appointment.date = newDate;
    appointment.timeSlot = timeSlot;
    appointment.status = "confirmed";
    if (reason) {
      appointment.reason = reason;
    }
    appointment.notes = `Rescheduled by patient on ${new Date().toLocaleDateString()}`;
    await appointment.save();

    const docRef = appointment.doctorId as any;
    const doctorName = docRef?.name || "your doctor";

    // 1. Notify Patient
    try {
      await NotificationService.createNotification({
        recipientUserId: user._id,
        title: "Appointment Rescheduled",
        message: `Your appointment with ${doctorName} has been rescheduled to ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
        type: "appointment",
        link: "/patient/appointments",
        relatedResource: {
          resourceType: "appointment",
          resourceId: appointment._id.toString(),
        },
      });
    } catch (e) {
      console.error("Failed to notify patient of reschedule:", e);
    }

    // 2. Notify Doctor
    try {
      if (docRef?.userId) {
        await NotificationService.createNotification({
          recipientUserId: docRef.userId,
          title: "Appointment Rescheduled",
          message: `Patient ${user.name} has rescheduled their appointment to ${new Date(date).toLocaleDateString()} at ${timeSlot}.`,
          type: "appointment",
          link: "/doctor/queue",
          relatedResource: {
            resourceType: "appointment",
            resourceId: appointment._id.toString(),
          },
        });
      }
    } catch (e) {
      console.error("Failed to notify doctor of reschedule:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Appointment rescheduled successfully",
      appointment,
    });
  } catch (error: unknown) {
    const err = error as any;
    const status = err?.statusCode || (err?.message?.includes("Forbidden") ? 403 : err?.message?.includes("Unauthorized") ? 401 : 500);
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: err?.message || "Unauthorized" }, { status });
    }
    console.error("Reschedule appointment error:", error);
    return NextResponse.json({ error: "Failed to reschedule appointment" }, { status: 500 });
  }
}
