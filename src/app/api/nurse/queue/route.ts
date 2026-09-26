import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { Queue, Patient, Doctor, Appointment, NursingAssessment } from "@/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (priority && priority !== "all") {
      query.priority = priority;
    }

    const queueItems = await Queue.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth phone allergies emergencyContact",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber avatar")
      .populate("appointmentId", "timeSlot reason status")
      .sort({
        // Urgency first
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

    const latestAssessmentByPatient: Record<string, any> = {};
    for (const a of assessments) {
      const pid = a.patientId.toString();
      if (!latestAssessmentByPatient[pid]) {
        latestAssessmentByPatient[pid] = a;
      }
    }

    let enriched = queueItems.map((q: any) => {
      const pid = q.patientId?._id?.toString();
      const latest = pid ? latestAssessmentByPatient[pid] : null;
      return {
        ...q,
        latestAssessment: latest || null,
        vitals: latest?.vitals || null,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      enriched = enriched.filter((item: any) => {
        const name = `${item.patientId?.firstName || ""} ${item.patientId?.lastName || ""} ${item.patientId?.userId?.name || ""}`.toLowerCase();
        const mrn = (item.patientId?.mrn || "").toLowerCase();
        const ticket = (item.ticketNumber || "").toLowerCase();
        const doc = (item.doctorId?.name || "").toLowerCase();
        return name.includes(s) || mrn.includes(s) || ticket.includes(s) || doc.includes(s);
      });
    }

    return NextResponse.json({ queue: enriched });
  } catch (error: any) {
    console.error("Nurse queue GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load queue" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const session = await requireNurseSession();

    const body = await request.json();
    const { queueId, status, priority, roomNumber, notes } = body;

    if (!queueId) {
      return NextResponse.json({ error: "queueId is required" }, { status: 400 });
    }

    const queueItem = await Queue.findById(queueId);
    if (!queueItem) {
      return NextResponse.json({ error: "Queue entry not found" }, { status: 404 });
    }

    if (status) {
      const validStatuses = [
        "waiting",
        "in-assessment",
        "ready-for-doctor",
        "in-consultation",
        "completed",
        "called",
        "cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      queueItem.status = status;
      if (status === "completed") {
        queueItem.completedTime = new Date();
      }
    }

    if (priority) {
      const validPriorities = ["normal", "priority", "urgent", "vip"];
      if (validPriorities.includes(priority)) {
        queueItem.priority = priority;
      }
    }

    if (roomNumber) {
      queueItem.roomNumber = roomNumber;
    }

    if (notes !== undefined) {
      queueItem.notes = notes;
    }

    await queueItem.save();

    return NextResponse.json({
      message: "Queue updated successfully",
      queueItem,
      updatedBy: session.user.name,
    });
  } catch (error: any) {
    console.error("Nurse queue PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update queue" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
