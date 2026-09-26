import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import {
  Queue,
  Patient,
  Doctor,
  Appointment,
  NursingAssessment,
  LabReport,
  FollowUp,
  Prescription,
  Consultation,
  Visit,
} from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // 1. Fetch doctor queue items
    // Condition: Doctor's queue items or department's queue items that are ready-for-doctor, in-consultation, or completed today
    const queueItems = await Queue.find({
      $and: [
        {
          $or: [
            { doctorId },
            { department: session.doctor.department },
          ],
        },
        {
          $or: [
            { status: { $in: ["ready-for-doctor", "in-consultation"] } },
            {
              status: "completed",
              updatedAt: { $gte: todayStart, $lt: todayEnd },
            },
          ],
        },
      ],
    })
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

    // 2. Fetch latest nursing assessments for these patients
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

    // Enrich queue items
    const enrichedQueue = queueItems.map((q: any) => {
      const pid = q.patientId?._id?.toString();
      const assessment = pid ? latestAssessmentByPatient[pid] : null;

      const checkedIn = new Date(q.checkedInTime).getTime();
      const waitingMinutes = Math.max(0, Math.floor((Date.now() - checkedIn) / 60000));

      const patientName =
        q.patientId?.userId?.name ||
        `${q.patientId?.firstName || ""} ${q.patientId?.lastName || ""}`.trim() ||
        "Unnamed Patient";

      return {
        _id: q._id.toString(),
        ticketNumber: q.ticketNumber,
        status: q.status,
        priority: q.priority,
        roomNumber: q.roomNumber || session.doctor.roomNumber,
        department: q.department,
        checkedInTime: q.checkedInTime,
        waitingMinutes,
        patient: {
          _id: q.patientId?._id?.toString(),
          name: patientName,
          mrn: q.patientId?.mrn || "MRN-N/A",
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
          reason: q.appointmentId?.reason || q.notes || "Clinical Consultation",
          status: q.appointmentId?.status || "confirmed",
        },
        nurseAssessment: assessment
          ? {
              status: assessment.status,
              vitals: assessment.vitals,
              chiefComplaint: assessment.chiefComplaint,
              triagePriority: assessment.triagePriority,
              nurseName: assessment.nurseName,
              doctorHandoffNotes: assessment.doctorHandoffNotes,
            }
          : null,
      };
    });

    // 3. Operational KPIs
    const waitingCount = enrichedQueue.filter((q) => q.status === "ready-for-doctor").length;
    const inConsultationCount = enrichedQueue.filter((q) => q.status === "in-consultation").length;
    const todayConsultationsCount = enrichedQueue.filter((q) => q.status === "completed").length;

    // Lab reports count (pending review or ordered)
    const pendingLabReportsCount = await LabReport.countDocuments({
      doctorId,
      status: { $in: ["pending", "in-progress"] },
    });

    // Follow-ups today count
    const followUpsTodayCount = await FollowUp.countDocuments({
      doctorId,
      recommendedDate: { $gte: todayStart, $lt: todayEnd },
      status: { $in: ["pending", "scheduled"] },
    });

    // 4. Quick attention items
    const quickAttention = enrichedQueue
      .filter((q) => q.priority === "urgent" || q.priority === "priority" || q.nurseAssessment?.triagePriority === "urgent")
      .slice(0, 4)
      .map((q) => ({
        id: q._id,
        patientName: q.patient.name,
        patientId: q.patient._id,
        badgeText: q.priority === "urgent" ? "Urgent Priority" : "Priority",
        badgeType: q.priority === "urgent" ? "error" : "warning",
        description: q.nurseAssessment?.chiefComplaint || q.appointment.reason || "Requires Doctor Review",
      }));

    // 5. Recent activity feed
    const recentConsultations = await Consultation.find({ doctorId, status: "completed" })
      .populate({ path: "patientId", populate: { path: "userId" } })
      .sort({ completedAt: -1 })
      .limit(3)
      .lean();

    const recentPrescriptions = await Prescription.find({ doctorId })
      .populate({ path: "patientId", populate: { path: "userId" } })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    const recentLabs = await LabReport.find({ doctorId, status: "verified" })
      .populate({ path: "patientId", populate: { path: "userId" } })
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentActivity: any[] = [];

    for (const lab of recentLabs) {
      const pName = (lab.patientId as any)?.userId?.name || "Patient";
      recentActivity.push({
        id: lab._id.toString(),
        type: "lab",
        title: `Lab report verified for ${pName}`,
        detail: `${lab.testName} • ${lab.verifiedBy || "Verified"}`,
        timestamp: lab.updatedAt || lab.createdAt,
      });
    }

    for (const rx of recentPrescriptions) {
      const pName = (rx.patientId as any)?.userId?.name || "Patient";
      const medSummary = rx.medications?.map((m: any) => m.medicine).slice(0, 2).join(", ") || "Medications";
      recentActivity.push({
        id: rx._id.toString(),
        type: "prescription",
        title: `Prescription created for ${pName}`,
        detail: `${medSummary}`,
        timestamp: rx.createdAt,
      });
    }

    for (const c of recentConsultations) {
      const pName = (c.patientId as any)?.userId?.name || "Patient";
      recentActivity.push({
        id: c._id.toString(),
        type: "consultation",
        title: `Consultation completed for ${pName}`,
        detail: `${c.diagnosis || "Encounter finalized"}`,
        timestamp: c.completedAt || c.updatedAt,
      });
    }

    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      doctor: {
        _id: session.doctor._id.toString(),
        name: session.doctor.name,
        specialty: session.doctor.specialty,
        department: session.doctor.department,
        qualification: session.doctor.qualification,
        roomNumber: session.doctor.roomNumber,
        avatar: session.doctor.avatar,
      },
      stats: {
        waitingCount,
        inConsultationCount,
        todayConsultationsCount,
        pendingLabReportsCount,
        followUpsTodayCount,
        totalToday: waitingCount + inConsultationCount + todayConsultationsCount,
      },
      queue: enrichedQueue,
      quickAttention,
      recentActivity: recentActivity.slice(0, 6),
    });
  } catch (error: any) {
    console.error("Doctor dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctor dashboard data" },
      { status: 500 }
    );
  }
}
