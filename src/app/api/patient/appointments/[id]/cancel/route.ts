import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { Appointment, Notification } from "@/models";

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
    }).populate("doctorId", "name");

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

    const docRef = appointment.doctorId as unknown as { name?: string };
    const doctorName = docRef?.name || "your doctor";

    await Notification.create({
      recipientId: user._id,
      title: "Appointment Cancelled",
      message: `Your appointment with ${doctorName} on ${new Date(appointment.date).toLocaleDateString()} was cancelled.`,
      type: "appointment",
      link: "/patient/appointments",
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Cancel appointment error:", error);
    return NextResponse.json({ error: "Failed to cancel appointment" }, { status: 500 });
  }
}
