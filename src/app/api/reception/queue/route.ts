import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";
import { Queue, Appointment, Patient, Doctor } from "@/models";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department") || "all";
    const status = searchParams.get("status") || "all";
    const doctorId = searchParams.get("doctorId") || "all";

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const queueFilter: Record<string, unknown> = {
      createdAt: { $gte: todayStart, $lt: todayEnd },
    };

    if (status && status !== "all") {
      queueFilter.status = status;
    }
    if (department && department !== "all") {
      queueFilter.department = department;
    }
    if (doctorId && doctorId !== "all" && Types.ObjectId.isValid(doctorId)) {
      queueFilter.doctorId = new Types.ObjectId(doctorId);
    }

    const queueList = await Queue.find(queueFilter)
      .populate({
        path: "patientId",
        select: "mrn phone bloodGroup dateOfBirth gender",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .populate("appointmentId", "timeSlot reason status")
      .sort({ status: 1, priority: -1, checkedInTime: 1 });

    // Fetch today's confirmed/scheduled appointments not yet checked in
    const checkinCandidates = await Appointment.find({
      date: { $gte: todayStart, $lt: todayEnd },
      status: { $in: ["confirmed", "scheduled"] },
    })
      .populate({
        path: "patientId",
        select: "mrn phone bloodGroup gender",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber")
      .sort({ timeSlot: 1 });

    // Compute stats
    const allTodayQueue = await Queue.find({
      createdAt: { $gte: todayStart, $lt: todayEnd },
    });

    const waiting = allTodayQueue.filter((q) => q.status === "waiting").length;
    const inConsultation = allTodayQueue.filter((q) => q.status === "in-consultation").length;
    const completed = allTodayQueue.filter((q) => q.status === "completed").length;
    const urgent = allTodayQueue.filter(
      (q) => (q.priority === "urgent" || q.priority === "vip") && q.status === "waiting"
    ).length;

    // Estimate average wait time from checked-in time to now for waiting patients
    const now = Date.now();
    const waitTimes = allTodayQueue
      .filter((q) => q.status === "waiting")
      .map((q) => Math.max(0, Math.floor((now - new Date(q.checkedInTime).getTime()) / (60 * 1000))));
    const avgWaitMinutes =
      waitTimes.length > 0
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 14;

    return NextResponse.json({
      success: true,
      queue: queueList,
      candidates: checkinCandidates,
      stats: {
        total: allTodayQueue.length,
        waiting,
        inConsultation,
        completed,
        urgent,
        avgWaitMinutes,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Queue GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user: receptionist } = await requireReceptionSession();

    const body = await req.json();
    const { appointmentId, patientId, doctorId, priority = "normal", notes } = body;

    let targetPatientId = patientId;
    let targetDoctorId = doctorId;
    let department = "General Medicine";
    let roomNumber = "Consultation Room 101";

    if (appointmentId && Types.ObjectId.isValid(appointmentId)) {
      const appt = await Appointment.findById(appointmentId).populate("doctorId");
      if (appt) {
        appt.status = "checked-in";
        await appt.save();
        targetPatientId = appt.patientId;
        targetDoctorId = appt.doctorId._id;
        const doc = appt.doctorId as unknown as { department?: string; roomNumber?: string };
        department = doc.department || department;
        roomNumber = doc.roomNumber || roomNumber;
      }
    } else if (targetDoctorId && Types.ObjectId.isValid(targetDoctorId)) {
      const doc = await Doctor.findById(targetDoctorId);
      if (doc) {
        department = doc.department || department;
        roomNumber = doc.roomNumber || roomNumber;
      }
    }

    if (!targetPatientId || !targetDoctorId) {
      return NextResponse.json(
        { error: "Patient and Doctor are required to generate queue token" },
        { status: 400 }
      );
    }

    // Generate ticket number
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const countToday = await Queue.countDocuments({
      createdAt: { $gte: todayStart },
    });
    const ticketNumber = `Q-${String(countToday + 20).padStart(3, "0")}`;

    const newQueue = await Queue.create({
      ticketNumber,
      patientId: targetPatientId,
      doctorId: targetDoctorId,
      appointmentId: appointmentId || undefined,
      department,
      roomNumber,
      status: "waiting",
      priority,
      source: appointmentId ? "appointment" : "walk-in",
      checkedInTime: new Date(),
      notes: notes || `Checked in by Receptionist ${receptionist.name}`,
    });

    const populated = await Queue.findById(newQueue._id)
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty department roomNumber");

    return NextResponse.json({
      success: true,
      message: `Queue token ${ticketNumber} generated`,
      queue: populated,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Queue POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const body = await req.json();
    const { id, status, priority, roomNumber, notes } = body;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Valid queue item ID required" }, { status: 400 });
    }

    const updateFields: Record<string, unknown> = {};
    if (status) {
      updateFields.status = status;
      if (status === "called") updateFields.calledTime = new Date();
      if (status === "completed") updateFields.completedTime = new Date();
    }
    if (priority) updateFields.priority = priority;
    if (roomNumber) updateFields.roomNumber = roomNumber;
    if (notes !== undefined) updateFields.notes = notes;

    const updated = await Queue.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    )
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty department roomNumber");

    return NextResponse.json({
      success: true,
      message: "Queue updated successfully",
      queue: updated,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Queue PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
