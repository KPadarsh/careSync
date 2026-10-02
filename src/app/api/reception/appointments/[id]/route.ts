import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";
import { Appointment, Doctor, Patient, Queue, Notification, User } from "@/models";
import { NotificationService } from "@/services/notification.service";
import { logAuditEvent } from "@/lib/audit";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid appointment ID" }, { status: 400 });
    }

    const appointment = await Appointment.findById(id)
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber avatar status workingHours");

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Check for associated queue token
    const queueEntry = await Queue.findOne({ appointmentId: appointment._id });

    return NextResponse.json({
      success: true,
      appointment,
      queueEntry,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception appointment GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: receptionist } = await requireReceptionSession();

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid appointment ID" }, { status: 400 });
    }

    const appointment = await Appointment.findById(id)
      .populate("patientId")
      .populate("doctorId");

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const body = await req.json();
    const action = body.action || "update";

    if (action === "check-in") {
      // 1. Update appointment status
      appointment.status = "checked-in";
      await appointment.save();

      // 2. Check if already has a queue entry
      let queue = await Queue.findOne({ appointmentId: appointment._id });
      if (!queue) {
        // Calculate next ticket number for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const countToday = await Queue.countDocuments({
          createdAt: { $gte: todayStart },
        });
        const ticketNumber = `Q-${String(countToday + 20).padStart(3, "0")}`;

        const doc = appointment.doctorId as unknown as {
          _id: Types.ObjectId;
          department?: string;
          roomNumber?: string;
        };

        queue = await Queue.create({
          ticketNumber,
          patientId: appointment.patientId._id,
          doctorId: appointment.doctorId._id,
          appointmentId: appointment._id,
          department: doc.department || "General Medicine",
          roomNumber: doc.roomNumber || "Consultation Room 101",
          status: "waiting",
          priority: body.priority || "normal",
          source: "appointment",
          checkedInTime: new Date(),
          notes: body.notes || `Checked in by Receptionist ${receptionist.name}`,
        });
      }

      // Notify nurse triage station via NotificationService (MongoDB persistence + Socket.IO delivery)
      try {
        await NotificationService.notifyRole("NURSE", {
          title: "New Patient Ready",
          message: "A checked-in patient is ready for nursing assessment.",
          type: "queue",
          link: "/nurse/queue",
          relatedResource: {
            resourceType: "queue",
            resourceId: queue._id.toString(),
          },
        });

        // Also notify assigned doctor of patient arrival
        const doctorUserId = (appointment.doctorId as any)?.userId;
        const patientName = (appointment.patientId as any)?.firstName 
          ? `${(appointment.patientId as any).firstName} ${(appointment.patientId as any).lastName || ""}`.trim()
          : "Patient";
        if (doctorUserId) {
          await NotificationService.createNotification({
            recipientUserId: doctorUserId,
            title: `Patient Arrival: ${queue.ticketNumber}`,
            message: `${patientName} has checked in and is proceeding to nurse triage station.`,
            type: "queue",
            link: "/doctor/queue",
            relatedResource: {
              resourceType: "queue",
              resourceId: queue._id.toString(),
            },
          });
        }
      } catch (notifErr) {
        console.error("Failed to notify staff of check-in:", notifErr);
      }

      // Record audit event
      await logAuditEvent({
        actor: {
          userId: receptionist._id,
          name: receptionist.name,
          email: receptionist.email,
          role: receptionist.role,
        },
        action: "PATIENT_CHECKED_IN",
        resource: `Ticket ${queue.ticketNumber} for Patient ${(appointment.patientId as any)?.mrn || "Patient"}`,
        resourceType: "appointment",
        metadata: {
          appointmentId: appointment._id,
          queueId: queue._id,
          ticketNumber: queue.ticketNumber,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Patient checked in successfully. Assigned ticket ${queue.ticketNumber}`,
        appointment,
        queue,
      });
    }

    if (action === "reschedule") {
      const { newDate, newTimeSlot } = body;
      if (!newDate || !newTimeSlot) {
        return NextResponse.json(
          { error: "New date and time slot are required for rescheduling" },
          { status: 400 }
        );
      }

      const parsedDate = new Date(newDate);
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Verify no conflict
      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctorId: appointment.doctorId._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        timeSlot: newTimeSlot,
        status: { $in: ["scheduled", "confirmed", "checked-in"] },
      });

      if (conflict) {
        return NextResponse.json(
          { error: `The selected doctor already has a booking at ${newTimeSlot}.` },
          { status: 409 }
        );
      }

      appointment.date = parsedDate;
      appointment.timeSlot = newTimeSlot;
      appointment.status = "confirmed";
      appointment.notes = `${appointment.notes || ""}\nRescheduled by reception to ${newDate} ${newTimeSlot}`.trim();
      await appointment.save();

      return NextResponse.json({
        success: true,
        message: "Appointment rescheduled successfully",
        appointment,
      });
    }

    if (action === "cancel") {
      appointment.status = "cancelled";
      appointment.cancellationReason =
        body.cancellationReason || "Cancelled at reception desk";
      await appointment.save();

      // If queue entry exists, mark cancelled
      await Queue.findOneAndUpdate(
        { appointmentId: appointment._id },
        { status: "cancelled" }
      );

      return NextResponse.json({
        success: true,
        message: "Appointment cancelled",
        appointment,
      });
    }

    if (action === "confirm") {
      appointment.status = "confirmed";
      await appointment.save();

      return NextResponse.json({
        success: true,
        message: "Appointment confirmed",
        appointment,
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception appointment PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
