import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";
import { Appointment, Doctor, Patient, Queue } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Fetch today's appointments
    const todayAppointments = await Appointment.find({
      date: { $gte: todayStart, $lt: todayEnd },
    })
      .populate("patientId", "mrn bloodGroup gender phone")
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber avatar status")
      .sort({ timeSlot: 1, createdAt: 1 });

    // Fetch active queue for today
    const activeQueue = await Queue.find({
      createdAt: { $gte: todayStart, $lt: todayEnd },
    })
      .populate("patientId", "mrn phone")
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .sort({ priority: -1, checkedInTime: 1 });

    // Active doctors
    const doctors = await Doctor.find({ status: "active" }).select(
      "name specialty department roomNumber avatar status workingHours"
    );

    // Calculate metrics
    const totalToday = todayAppointments.length;
    const checkedInCount = activeQueue.filter(
      (q) => q.status === "waiting" || q.status === "called" || q.status === "in-consultation"
    ).length;
    const waitingCount = activeQueue.filter((q) => q.status === "waiting").length;
    const inConsultationCount = activeQueue.filter((q) => q.status === "in-consultation").length;
    const completedCount = activeQueue.filter((q) => q.status === "completed").length;
    const urgentCount = activeQueue.filter(
      (q) => (q.priority === "urgent" || q.priority === "vip") && q.status === "waiting"
    ).length;

    // Doctor workload summary
    const doctorStats = doctors.map((doc) => {
      const docQueue = activeQueue.filter(
        (q) => q.doctorId && q.doctorId._id.toString() === doc._id.toString()
      );
      const docWaiting = docQueue.filter((q) => q.status === "waiting").length;
      const currentPatient = docQueue.find((q) => q.status === "in-consultation");

      return {
        _id: doc._id,
        name: doc.name,
        specialty: doc.specialty,
        department: doc.department,
        roomNumber: doc.roomNumber,
        avatar: doc.avatar,
        waitingCount: docWaiting,
        currentTicket: currentPatient?.ticketNumber || null,
        status: docWaiting > 4 ? "busy" : "available",
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalAppointments: totalToday,
        checkedIn: checkedInCount,
        waiting: waitingCount,
        inConsultation: inConsultationCount,
        completed: completedCount,
        urgentCases: urgentCount,
        activeDoctors: doctors.length,
      },
      appointments: todayAppointments,
      queue: activeQueue,
      doctors: doctorStats,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
