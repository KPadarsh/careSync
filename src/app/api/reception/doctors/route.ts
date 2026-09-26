import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";
import { Doctor, Queue } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const doctors = await Doctor.find({ status: "active" }).sort({ name: 1 });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const activeQueue = await Queue.find({
      createdAt: { $gte: todayStart },
      status: { $in: ["waiting", "called", "in-consultation"] },
    });

    const enrichedDoctors = doctors.map((doc) => {
      const docQueue = activeQueue.filter(
        (q) => q.doctorId && q.doctorId.toString() === doc._id.toString()
      );
      const waiting = docQueue.filter((q) => q.status === "waiting").length;
      const inConsult = docQueue.find((q) => q.status === "in-consultation");

      return {
        _id: doc._id,
        name: doc.name,
        specialty: doc.specialty,
        department: doc.department,
        qualification: doc.qualification,
        roomNumber: doc.roomNumber,
        avatar: doc.avatar,
        status: doc.status,
        workingHours: doc.workingHours,
        slotDurationMinutes: doc.slotDurationMinutes,
        waitingCount: waiting,
        currentTicket: inConsult?.ticketNumber || null,
      };
    });

    return NextResponse.json({
      success: true,
      doctors: enrichedDoctors,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Doctors GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
