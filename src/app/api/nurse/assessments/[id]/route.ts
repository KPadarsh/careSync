import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { Patient, Queue, NursingAssessment, Doctor, Notification } from "@/models";
import { NotificationService } from "@/services/notification.service";
import { logAuditEvent } from "@/lib/audit";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Check if id is an assessmentId or patientId
    let assessment = await NursingAssessment.findById(id)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth phone allergies emergencyContact",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department roomNumber")
      .lean();

    let patient: any = null;

    if (assessment) {
      patient = assessment.patientId;
    } else {
      // Look for latest draft or latest assessment for this patient
      patient = await Patient.findById(id)
        .populate("userId", "name email phone avatar")
        .lean();

      if (!patient) {
        return NextResponse.json({ error: "Patient or Assessment not found" }, { status: 404 });
      }

      assessment = await NursingAssessment.findOne({
        patientId: patient._id,
      })
        .sort({ status: 1, createdAt: -1 })
        .populate("doctorId", "name specialty department roomNumber")
        .lean();
    }

    // Fetch active queue
    const activeQueue = await Queue.findOne({
      patientId: patient._id,
      status: { $in: ["waiting", "in-assessment", "ready-for-doctor", "in-consultation"] },
    })
      .populate("doctorId", "name specialty roomNumber")
      .lean();

    return NextResponse.json({
      assessment,
      patient,
      activeQueue,
    });
  } catch (error: any) {
    console.error("Nurse assessment GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load assessment" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireNurseSession();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid patient ID format" }, { status: 400 });
    }

    // `id` is patientId (or assessmentId)
    let patient = await Patient.findById(id);
    let existingAssessment: any = null;

    if (!patient) {
      existingAssessment = await NursingAssessment.findById(id);
      if (existingAssessment) {
        patient = await Patient.findById(existingAssessment.patientId);
      }
    }

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      chiefComplaint,
      symptoms,
      painScore,
      painLocation,
      painCharacteristics,
      observations,
      condition,
      mobility,
      triagePriority,
      doctorHandoffNotes,
      generalNotes,
      vitals,
      status, // "draft" | "completed"
    } = body;

    // Find active queue item (most recent)
    const activeQueue = await Queue.findOne({
      patientId: patient._id,
      status: { $in: ["waiting", "in-assessment", "ready-for-doctor"] },
    }).sort({ createdAt: -1 });

    // Check if we are updating an existing draft assessment
    if (!existingAssessment) {
      existingAssessment = await NursingAssessment.findOne({
        patientId: patient._id,
        status: "draft",
      });
    }

    const isFinalizing =
      status === "completed" ||
      body.action === "complete" ||
      body.action === "finalize";

    let assessmentDoc: any;

    if (existingAssessment && existingAssessment.status === "draft") {
      // Update draft
      existingAssessment.chiefComplaint = chiefComplaint || existingAssessment.chiefComplaint;
      if (symptoms) existingAssessment.symptoms = Array.isArray(symptoms) ? symptoms : [symptoms];
      if (painLocation !== undefined) existingAssessment.painLocation = painLocation;
      if (painCharacteristics !== undefined) existingAssessment.painCharacteristics = painCharacteristics;
      if (observations) existingAssessment.observations = observations;
      if (condition) existingAssessment.condition = condition;
      if (mobility) existingAssessment.mobility = mobility;
      if (triagePriority) existingAssessment.triagePriority = triagePriority;
      if (doctorHandoffNotes !== undefined) existingAssessment.doctorHandoffNotes = doctorHandoffNotes;
      if (generalNotes !== undefined) existingAssessment.generalNotes = generalNotes;

      if (vitals) {
        existingAssessment.vitals = {
          ...existingAssessment.vitals,
          ...vitals,
          painScore: painScore !== undefined ? Number(painScore) : (vitals.painScore || 0),
          recordedAt: new Date(),
        };
      } else if (painScore !== undefined) {
        if (!existingAssessment.vitals) existingAssessment.vitals = {};
        existingAssessment.vitals.painScore = Number(painScore);
      }

      existingAssessment.status = isFinalizing ? "completed" : "draft";
      if (isFinalizing) {
        existingAssessment.completedAt = new Date();
      }
      existingAssessment.nurseId = session.user._id as any;
      existingAssessment.nurseName = `${session.user.name}, RN`;

      await existingAssessment.save();
      assessmentDoc = existingAssessment;
    } else {
      // Create new assessment
      assessmentDoc = await NursingAssessment.create({
        patientId: patient._id,
        nurseId: session.user._id,
        nurseName: `${session.user.name}, RN`,
        queueId: activeQueue?._id,
        doctorId: activeQueue?.doctorId,
        vitals: {
          ...(vitals || {}),
          painScore: painScore !== undefined ? Number(painScore) : 0,
          recordedAt: new Date(),
        },
        chiefComplaint: chiefComplaint || "General triage evaluation",
        symptoms: Array.isArray(symptoms) ? symptoms : symptoms ? [symptoms] : [],
        painLocation,
        painCharacteristics,
        observations: observations || "Patient alert and responsive.",
        condition: condition || "stable",
        mobility: mobility || "independent",
        triagePriority: triagePriority || "normal",
        doctorHandoffNotes: doctorHandoffNotes || "",
        generalNotes: generalNotes || "",
        status: isFinalizing ? "completed" : "draft",
        completedAt: isFinalizing ? new Date() : undefined,
      });
    }

    // Update Queue workflow state:
    // If saving draft and queue is waiting -> queue becomes in-assessment
    // If completing assessment -> queue becomes ready-for-doctor, with priority set!
    if (activeQueue) {
      if (isFinalizing) {
        activeQueue.status = "ready-for-doctor";
        if (triagePriority) {
          activeQueue.priority = triagePriority;
        }
        await activeQueue.save();

        // Notify assigned doctor via NotificationService
        try {
          const doctorDoc = await Doctor.findById(activeQueue.doctorId);
          const patientUser = (patient as any)?.userId?.name || `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Patient";
          if (doctorDoc?.userId) {
            await NotificationService.createNotification({
              recipientUserId: doctorDoc.userId,
              title: `Patient Ready in Queue (${activeQueue.ticketNumber})`,
              message: `${patientUser} completed triage vitals and is ready for consultation. Priority: ${activeQueue.priority}.`,
              type: "queue",
              link: "/doctor/queue",
              relatedResource: {
                resourceType: "queue",
                resourceId: activeQueue._id.toString(),
              },
            });
          } else {
            await NotificationService.notifyRole("DOCTOR", {
              title: `Patient Ready in Queue (${activeQueue.ticketNumber})`,
              message: `${patientUser} completed triage vitals and is ready for consultation. Priority: ${activeQueue.priority}.`,
              type: "queue",
              link: "/doctor/queue",
              relatedResource: {
                resourceType: "queue",
                resourceId: activeQueue._id.toString(),
              },
            });
          }
        } catch (notifErr) {
          console.error("Failed to notify doctor:", notifErr);
        }

        // Record audit event
        await logAuditEvent({
          actor: {
            userId: session.user._id,
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          },
          action: "NURSING_ASSESSMENT_COMPLETED",
          resource: `Assessment for Patient ${patient.mrn} (Ready for Doctor)`,
          resourceType: "nursing",
          metadata: {
            patientId: patient._id,
            queueId: activeQueue._id,
            priority: activeQueue.priority,
            condition,
          },
        });
      } else if (activeQueue.status === "waiting") {
        activeQueue.status = "in-assessment";
        await activeQueue.save();
      }
    }

    return NextResponse.json({
      message: isFinalizing ? "Assessment completed and patient marked Ready for Doctor" : "Draft saved successfully",
      assessment: assessmentDoc,
      queueStatus: activeQueue?.status,
    });
  } catch (error: any) {
    console.error("Nurse assessment POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save assessment" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
