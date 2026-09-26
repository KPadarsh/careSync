import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";
import { FollowUp, Patient, Doctor } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("status") || "all";

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const filter: Record<string, unknown> = {};

    if (filterType === "due-today") {
      filter.recommendedDate = { $gte: todayStart, $lt: todayEnd };
      filter.status = "pending";
    } else if (filterType === "upcoming") {
      filter.recommendedDate = { $gte: todayEnd };
      filter.status = "pending";
    } else if (filterType === "overdue") {
      filter.recommendedDate = { $lt: todayStart };
      filter.status = "pending";
    } else if (filterType !== "all") {
      filter.status = filterType;
    }

    const followUps = await FollowUp.find(filter)
      .populate({
        path: "patientId",
        select: "mrn phone bloodGroup gender",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .populate("scheduledAppointmentId", "date timeSlot status")
      .sort({ recommendedDate: 1 });

    // Category stats
    const allPending = await FollowUp.find({ status: "pending" });
    const dueTodayCount = allPending.filter((f) => {
      const d = new Date(f.recommendedDate);
      return d >= todayStart && d < todayEnd;
    }).length;
    const overdueCount = allPending.filter((f) => new Date(f.recommendedDate) < todayStart).length;
    const upcomingCount = allPending.filter((f) => new Date(f.recommendedDate) >= todayEnd).length;
    const completedCount = await FollowUp.countDocuments({ status: "completed" });

    return NextResponse.json({
      success: true,
      followUps,
      stats: {
        dueToday: dueTodayCount,
        overdue: overdueCount,
        upcoming: upcomingCount,
        completed: completedCount,
        total: allPending.length + completedCount,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Follow-ups GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
