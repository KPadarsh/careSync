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

    const body = await req.json().catch(() => ({}));
    const { reason = "Cancelled by patient" } = body;

    // Security Rule: match _id AND patientId (patient cannot cancel someone else's appointment)
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

    if (appointment.status === "cancelled") {
      return NextResponse.json(
        { error: "Appointment is already cancelled" },
        { status: 400 }
      );
    }

    appointment.status = "cancelled";
    appointment.cancellationReason = reason;
    await appointment.save();

    const docRef = appointment.doctorId as any;
    const doctorName = docRef?.name || "your doctor";

    // 1. Notify Patient
    try {
      await NotificationService.createNotification({
        recipientUserId: user._id,
        title: "Appointment Cancelled",
        message: `Your appointment with ${doctorName} on ${new Date(appointment.date).toLocaleDateString()} was cancelled.`,
        type: "appointment",
        link: "/patient/appointments",
        relatedResource: {
          resourceType: "appointment",
          resourceId: appointment._id.toString(),
        },
      });
    } catch (e) {
      console.error("Failed to notify patient of cancellation:", e);
    }

    // 2. Notify Doctor
    try {
      if (docRef?.userId) {
        await NotificationService.createNotification({
          recipientUserId: docRef.userId,
          title: "Appointment Cancelled",
          message: `Patient ${user.name} has cancelled their appointment on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.timeSlot}.`,
          type: "appointment",
          link: "/doctor/queue",
          relatedResource: {
            resourceType: "appointment",
            resourceId: appointment._id.toString(),
          },
        });
      }
    } catch (e) {
      console.error("Failed to notify doctor of cancellation:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error: unknown) {
    const err = error as any;
    const status = err?.statusCode || (err?.message?.includes("Forbidden") ? 403 : err?.message?.includes("Unauthorized") ? 401 : 500);
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: err?.message || "Unauthorized" }, { status });
    }
    console.error("Cancel appointment error:", error);
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }
}
