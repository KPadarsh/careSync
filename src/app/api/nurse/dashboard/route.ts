import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { Queue, Patient, Doctor, Appointment, NursingAssessment, NurseTask } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requireNurseSession();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Fetch queue items for today
    const queueItems = await Queue.find({
      $or: [
        { checkedInTime: { $gte: todayStart, $lt: todayEnd } },
        { status: { $in: ["waiting", "in-assessment", "ready-for-doctor", "called"] } },
      ],
    })
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth phone allergies emergencyContact",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .populate("appointmentId", "timeSlot reason status")
      .sort({
        // Priority sort: urgent > priority > normal
        priority: -1,
        checkedInTime: 1,
      })
      .lean();

    // Fetch latest nursing assessments for these patients
    const patientIds = queueItems
      .map((q: any) => q.patientId?._id)
      .filter(Boolean);

    const assessments = await NursingAssessment.find({
      patientId: { $in: patientIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Map latest assessment by patientId string
    const latestAssessmentByPatient: Record<string, any> = {};
    for (const a of assessments) {
      const pid = a.patientId.toString();
      if (!latestAssessmentByPatient[pid]) {
        latestAssessmentByPatient[pid] = a;
      }
    }

    // Attach latest vitals & assessment status to queue items
    const enrichedQueue = queueItems.map((q: any) => {
      const pid = q.patientId?._id?.toString();
      const latest = pid ? latestAssessmentByPatient[pid] : null;
      return {
        ...q,
        latestAssessment: latest || null,
        vitals: latest?.vitals || null,
      };
    });

    // Metric counts
    const patientsWaiting = enrichedQueue.filter((q: any) => q.status === "waiting").length;
    const assessmentsPending = enrichedQueue.filter(
      (q: any) => q.status === "in-assessment" || (q.status === "waiting" && !q.latestAssessment)
    ).length;
    const readyForDoctor = enrichedQueue.filter((q: any) => q.status === "ready-for-doctor").length;

    // Fetch nursing tasks
    const nursingTasks = await NurseTask.find({})
      .sort({ status: 1, priority: -1, createdAt: -1 })
      .limit(10)
      .lean();

    const tasksDue = await NurseTask.countDocuments({ status: { $ne: "completed" } });

    // Patients needing attention: urgent priority, high pain score, or flagged conditions
    const needingAttention = enrichedQueue.filter((q: any) => {
      const isUrgent = q.priority === "urgent" || q.priority === "priority";
      const hasCriticalCond =
        q.latestAssessment?.condition === "critical" ||
        q.latestAssessment?.condition === "needs-monitoring";
      const highPain = (q.latestAssessment?.vitals?.painScore || 0) >= 6;
      return isUrgent || hasCriticalCond || highPain;
    });

    return NextResponse.json({
      metrics: {
        patientsWaiting,
        assessmentsPending,
        readyForDoctor,
        tasksDue,
      },
      todayPatients: enrichedQueue,
      needingAttention,
      nursingTasks,
      nurse: {
        name: session.user.name,
        email: session.user.email,
        role: session.role,
        station: "Triage Bay 3A - Main Clinical Wing",
        shift: "Morning Shift (08:00 - 16:30)",
      },
    });
  } catch (error: any) {
    console.error("Nurse dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load nurse dashboard data" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
