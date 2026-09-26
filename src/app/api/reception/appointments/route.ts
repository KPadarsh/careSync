import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";
import { Appointment, Doctor, Patient, User, Queue, FollowUp, Notification } from "@/models";
import { Types } from "mongoose";

const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Date is required"),
  timeSlot: z.string().min(1, "Time slot is required"),
  type: z.enum(["in-person", "teleconsultation"]).default("in-person"),
  reason: z.string().min(3, "Reason for appointment is required"),
  notes: z.string().optional(),
  followUpId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const { searchParams } = new URL(req.url);
    const dateFilter = searchParams.get("date") || "today";
    const status = searchParams.get("status") || "all";
    const doctorId = searchParams.get("doctorId") || "";
    const department = searchParams.get("department") || "";
    const q = searchParams.get("q")?.trim() || "";

    const filter: Record<string, unknown> = {};

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    if (dateFilter === "today") {
      filter.date = { $gte: todayStart, $lt: todayEnd };
    } else if (dateFilter === "upcoming") {
      filter.date = { $gte: todayStart };
    } else if (dateFilter === "past") {
      filter.date = { $lt: todayStart };
    } else if (dateFilter !== "all") {
      const parsed = new Date(dateFilter);
      if (!isNaN(parsed.getTime())) {
        const start = new Date(parsed);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        filter.date = { $gte: start, $lt: end };
      }
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (doctorId && doctorId !== "all" && Types.ObjectId.isValid(doctorId)) {
      filter.doctorId = new Types.ObjectId(doctorId);
    }

    // Patient search query
    if (q) {
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
        ],
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      const matchingPatients = await Patient.find({
        $or: [
          { mrn: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
          { userId: { $in: userIds } },
        ],
      }).select("_id");

      filter.patientId = { $in: matchingPatients.map((p) => p._id) };
    }

    let appointments = await Appointment.find(filter)
      .populate({
        path: "patientId",
        select: "mrn phone bloodGroup dateOfBirth gender",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .sort({ date: 1, timeSlot: 1 });

    if (department && department !== "all") {
      appointments = appointments.filter(
        (a) =>
          a.doctorId &&
          (a.doctorId as unknown as { department?: string }).department === department
      );
    }

    // Attach queue tickets for today's checked-in appointments
    const appointmentIds = appointments.map((a) => a._id);
    const queueEntries = await Queue.find({
      appointmentId: { $in: appointmentIds },
    }).select("ticketNumber status priority checkedInTime appointmentId");

    const enriched = appointments.map((appt) => {
      const queue = queueEntries.find(
        (q) => q.appointmentId?.toString() === appt._id.toString()
      );
      return {
        ...appt.toObject(),
        queueTicket: queue?.ticketNumber || null,
        queueStatus: queue?.status || null,
        queuePriority: queue?.priority || null,
      };
    });

    // Counts for tabs/stats
    const totalCount = enriched.length;
    const confirmedCount = enriched.filter((a) => a.status === "confirmed").length;
    const checkedInCount = enriched.filter((a) => a.status === "checked-in").length;
    const completedCount = enriched.filter((a) => a.status === "completed").length;
    const cancelledCount = enriched.filter((a) => a.status === "cancelled").length;

    return NextResponse.json({
      success: true,
      appointments: enriched,
      stats: {
        total: totalCount,
        confirmed: confirmedCount,
        checkedIn: checkedInCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception appointments GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user: receptionist } = await requireReceptionSession();

    const body = await req.json();
    const validated = CreateAppointmentSchema.parse(body);

    if (!Types.ObjectId.isValid(validated.patientId)) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }
    if (!Types.ObjectId.isValid(validated.doctorId)) {
      return NextResponse.json({ error: "Invalid doctor ID" }, { status: 400 });
    }

    const patient = await Patient.findById(validated.patientId).populate(
      "userId",
      "name email"
    );
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const doctor = await Doctor.findById(validated.doctorId);
    if (!doctor || doctor.status !== "active") {
      return NextResponse.json(
        { error: "Doctor is unavailable or inactive" },
        { status: 400 }
      );
    }

    // Check slot availability
    const apptDate = new Date(validated.date);
    const startOfDay = new Date(apptDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(apptDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingSlot = await Appointment.findOne({
      doctorId: doctor._id,
      date: { $gte: startOfDay, $lte: endOfDay },
      timeSlot: validated.timeSlot,
      status: { $in: ["scheduled", "confirmed", "checked-in"] },
    });

    if (existingSlot) {
      return NextResponse.json(
        {
          error: `Dr. ${doctor.name} already has a confirmed booking at ${validated.timeSlot} on this date. Please select another time slot.`,
        },
        { status: 409 }
      );
    }

    // Create appointment using shared model
    const newAppointment: any = await Appointment.create({
      patientId: patient._id,
      doctorId: doctor._id,
      date: apptDate,
      timeSlot: validated.timeSlot,
      type: validated.type,
      reason: validated.reason,
      status: "confirmed",
      bookedBy: "RECEPTIONIST",
      notes: validated.notes || `Scheduled by Receptionist ${receptionist.name}`,
    });

    // If linked to follow-up, mark it scheduled
    if (validated.followUpId && Types.ObjectId.isValid(validated.followUpId)) {
      await FollowUp.findByIdAndUpdate(validated.followUpId, {
        status: "scheduled",
        scheduledAppointmentId: newAppointment._id,
      });
    }

    // Send notification to patient
    await Notification.create({
      recipientId: patient.userId,
      title: "Appointment Scheduled",
      message: `Your appointment with ${doctor.name} on ${apptDate.toLocaleDateString()} at ${validated.timeSlot} has been scheduled by reception.`,
      type: "appointment",
      link: "/patient/appointments",
    });

    return NextResponse.json({
      success: true,
      message: "Appointment created successfully",
      appointment: newAppointment,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception create appointment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
