import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import {
  Queue,
  Patient,
  Doctor,
  Appointment,
  NursingAssessment,
} from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get("status"); // all, waiting, in-consultation, completed
    const priority = searchParams.get("priority"); // all, high, routine
    const search = searchParams.get("search")?.trim().toLowerCase();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Patients properly handed off by nursing: ready-for-doctor, in-consultation, completed
    const query: any = {
      $or: [
        { doctorId },
        { department: session.doctor.department },
      ],
      status: { $in: ["ready-for-doctor", "in-consultation", "completed"] },
    };

    if (filterStatus && filterStatus !== "all") {
      if (filterStatus === "waiting") {
        query.status = "ready-for-doctor";
      } else {
        query.status = filterStatus;
      }
    }

    if (priority && priority !== "all") {
      if (priority === "high") {
        query.priority = { $in: ["urgent", "priority"] };
      } else if (priority === "routine") {
        query.priority = "normal";
      }
    }

    const queueItems = await Queue.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth phone allergies emergencyContact",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber")
      .populate("appointmentId", "timeSlot reason status")
      .sort({
        priority: -1,
        checkedInTime: 1,
      })
      .lean();

    // Fetch nursing assessments for these patients
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

    const enriched = queueItems
      .map((q: any) => {
        const pid = q.patientId?._id?.toString();
        const assessment = pid ? latestAssessmentByPatient[pid] : null;

        const checkedIn = new Date(q.checkedInTime).getTime();
        const waitingMinutes = Math.max(
          0,
          Math.floor((Date.now() - checkedIn) / 60000)
        );

        const patientName =
          q.patientId?.userId?.name ||
          `${q.patientId?.firstName || ""} ${q.patientId?.lastName || ""}`.trim() ||
          "Patient";

        const mrn = q.patientId?.mrn || "MRN-N/A";
        const reason = q.appointmentId?.reason || q.notes || "Clinical Consultation";

        return {
          _id: q._id.toString(),
          ticketNumber: q.ticketNumber,
          status: q.status,
          priority: q.priority,
          roomNumber: q.roomNumber || session.doctor.roomNumber,
          department: q.department,
          checkedInTime: q.checkedInTime,
          calledTime: q.calledTime,
          completedTime: q.completedTime,
          waitingMinutes,
          patient: {
            _id: q.patientId?._id?.toString(),
            name: patientName,
            mrn,
            gender: q.patientId?.gender || "unknown",
            age: q.patientId?.dateOfBirth
              ? Math.floor(
                  (Date.now() - new Date(q.patientId.dateOfBirth).getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000)
                )
              : 35,
            bloodGroup: q.patientId?.bloodGroup,
            allergies: q.patientId?.allergies || [],
            avatar: q.patientId?.userId?.avatar,
          },
          appointment: {
            timeSlot: q.appointmentId?.timeSlot || "10:30 AM",
            reason,
            status: q.appointmentId?.status || "confirmed",
          },
          nurseAssessment: assessment
            ? {
                _id: assessment._id.toString(),
                status: assessment.status,
                vitals: assessment.vitals,
                chiefComplaint: assessment.chiefComplaint,
                symptoms: assessment.symptoms,
                condition: assessment.condition,
                triagePriority: assessment.triagePriority,
                nurseName: assessment.nurseName,
                doctorHandoffNotes: assessment.doctorHandoffNotes,
                recordedAt: assessment.vitals?.recordedAt || assessment.createdAt,
              }
            : null,
        };
      })
      .filter((item) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          item.patient.name.toLowerCase().includes(s) ||
          item.patient.mrn.toLowerCase().includes(s) ||
          item.appointment.reason.toLowerCase().includes(s) ||
          item.ticketNumber.toLowerCase().includes(s)
        );
      });

    return NextResponse.json({
      items: enriched,
      counts: {
        all: enriched.length,
        waiting: enriched.filter((i) => i.status === "ready-for-doctor").length,
        inConsultation: enriched.filter((i) => i.status === "in-consultation").length,
        completed: enriched.filter((i) => i.status === "completed").length,
      },
    });
  } catch (error: any) {
    console.error("Doctor queue API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctor queue" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const body = await request.json();

    const { queueId, action } = body;
    if (!queueId) {
      return NextResponse.json(
        { error: "Queue ID is required" },
        { status: 400 }
      );
    }

    const queue = await Queue.findById(queueId);
    if (!queue) {
      return NextResponse.json(
        { error: "Queue item not found" },
        { status: 404 }
      );
    }

    if (action === "start-consultation" || action === "call-patient") {
      queue.status = "in-consultation";
      queue.calledTime = new Date();
      await queue.save();
    } else if (action === "complete-consultation") {
      queue.status = "completed";
      queue.completedTime = new Date();
      await queue.save();
    } else {
      return NextResponse.json(
        { error: `Invalid queue action: ${action}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      queue: {
        _id: queue._id.toString(),
        status: queue.status,
        calledTime: queue.calledTime,
        completedTime: queue.completedTime,
      },
    });
  } catch (error: any) {
    console.error("Doctor queue update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update queue item" },
      { status: 500 }
    );
  }
}
