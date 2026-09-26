import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession, hashPassword } from "@/lib/auth";
import { Queue, Appointment, Patient, Doctor, User } from "@/models";
import { Types } from "mongoose";
import { ROLES } from "@/lib/constants";

const WalkInSchema = z.object({
  // Existing or new patient
  patientId: z.string().optional(),
  newPatient: z
    .object({
      name: z.string().min(2),
      phone: z.string().min(7),
      email: z.string().email().optional(),
      gender: z.enum(["male", "female", "other"]).default("male"),
      dateOfBirth: z.string().optional(),
    })
    .optional(),
  doctorId: z.string().min(1, "Doctor selection is required"),
  department: z.string().min(1, "Department is required"),
  reason: z.string().min(3, "Visit reason is required"),
  priority: z.enum(["normal", "urgent", "vip"]).default("normal"),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user: receptionist } = await requireReceptionSession();

    const body = await req.json();
    const validated = WalkInSchema.parse(body);

    let patientId = validated.patientId;
    let patientRecord = null;

    // Handle new patient registration if patientId is not provided
    if (!patientId && validated.newPatient) {
      const email =
        validated.newPatient.email ||
        `walkin.${Date.now()}@patient.caresync.com`.toLowerCase();

      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: validated.newPatient.name,
          email,
          passwordHash: hashPassword("WelcomeCareSync2026!"),
          role: ROLES.PATIENT,
          phone: validated.newPatient.phone,
          status: "active",
        });
      }

      const count = await Patient.countDocuments();
      const mrn = `MRN-${85000 + count + 1}`;

      patientRecord = await Patient.create({
        userId: user._id,
        mrn,
        phone: validated.newPatient.phone,
        gender: validated.newPatient.gender,
        dateOfBirth: validated.newPatient.dateOfBirth
          ? new Date(validated.newPatient.dateOfBirth)
          : undefined,
      });
      patientId = patientRecord._id.toString();
    } else if (patientId && Types.ObjectId.isValid(patientId)) {
      patientRecord = await Patient.findById(patientId).populate("userId", "name phone email");
    }

    if (!patientRecord) {
      return NextResponse.json({ error: "Patient record could not be identified or created" }, { status: 400 });
    }

    const doctor = await Doctor.findById(validated.doctorId);
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const today = new Date();
    const timeSlot = today.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // 1. Create immediate walk-in appointment
    const appointment: any = await Appointment.create({
      patientId: patientRecord._id,
      doctorId: doctor._id,
      date: today,
      timeSlot,
      type: "in-person",
      reason: `[Walk-in] ${validated.reason}`,
      status: "checked-in",
      bookedBy: "RECEPTIONIST",
      notes: validated.notes || `Walk-in intake processed by Receptionist ${receptionist.name}`,
    });

    // 2. Generate Queue ticket
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const countToday = await Queue.countDocuments({
      createdAt: { $gte: todayStart },
    });
    const ticketNumber = `Q-${String(countToday + 20).padStart(3, "0")}`;

    const queue = await Queue.create({
      ticketNumber,
      patientId: patientRecord._id,
      doctorId: doctor._id,
      appointmentId: appointment._id,
      department: validated.department || doctor.department,
      roomNumber: doctor.roomNumber || "Consultation Room 101",
      status: "waiting",
      priority: validated.priority,
      source: "walk-in",
      checkedInTime: new Date(),
      notes: validated.notes || "Walk-in intake",
    });

    // Calculate queue position and estimated wait time
    const waitingBefore = await Queue.countDocuments({
      doctorId: doctor._id,
      status: "waiting",
      checkedInTime: { $lt: queue.checkedInTime },
    });
    const estimatedWaitMinutes = (waitingBefore + 1) * 15;

    return NextResponse.json({
      success: true,
      message: "Walk-in patient registered and queued successfully",
      ticket: {
        ticketNumber: queue.ticketNumber,
        patientName:
          (patientRecord.userId as unknown as { name?: string })?.name || "Patient",
        mrn: patientRecord.mrn,
        doctorName: doctor.name,
        specialty: doctor.specialty,
        roomNumber: doctor.roomNumber,
        department: doctor.department,
        priority: queue.priority,
        positionInQueue: waitingBefore + 1,
        estimatedWaitMinutes,
        checkedInTime: queue.checkedInTime,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Validation failed" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Walk-in POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
