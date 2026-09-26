import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import {
  Patient,
  Doctor,
  Appointment,
  Visit,
  Prescription,
  LabReport,
  MedicalRecord,
  NursingAssessment,
  Queue,
  Consultation,
} from "@/models";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireDoctorSession();

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Patient lookup by _id or mrn
    let patient: any = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      patient = await Patient.findById(id)
        .populate("userId", "name email phone avatar")
        .populate("primaryDoctorId", "name specialty department roomNumber")
        .lean();
    }
    if (!patient) {
      patient = await Patient.findOne({ mrn: id.toUpperCase() })
        .populate("userId", "name email phone avatar")
        .populate("primaryDoctorId", "name specialty department roomNumber")
        .lean();
    }

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    const patientId = patient._id;

    // Fetch parallel clinical chart components
    const [
      nursingAssessment,
      todayQueue,
      visits,
      prescriptions,
      labReports,
      medicalRecords,
      consultations,
    ] = await Promise.all([
      NursingAssessment.findOne({ patientId })
        .sort({ createdAt: -1 })
        .lean(),
      Queue.findOne({ patientId, status: { $in: ["ready-for-doctor", "in-consultation", "waiting"] } })
        .populate("appointmentId")
        .sort({ createdAt: -1 })
        .lean(),
      Visit.find({ patientId })
        .populate("doctorId", "name specialty")
        .sort({ visitDate: -1 })
        .limit(10)
        .lean(),
      Prescription.find({ patientId })
        .populate("doctorId", "name specialty")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      LabReport.find({ patientId })
        .populate("doctorId", "name specialty")
        .sort({ verifiedDate: -1, sampleCollectionDate: -1 })
        .limit(10)
        .lean(),
      MedicalRecord.find({ patientId })
        .populate("doctorId", "name specialty")
        .sort({ recordDate: -1 })
        .limit(10)
        .lean(),
      Consultation.find({ patientId })
        .populate("doctorId", "name specialty")
        .sort({ startedAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const patientName =
      patient.userId?.name ||
      `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
      "Patient";

    const age = patient.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(patient.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 32;

    return NextResponse.json({
      patient: {
        _id: patient._id.toString(),
        name: patientName,
        mrn: patient.mrn || "MRN-N/A",
        dateOfBirth: patient.dateOfBirth,
        age,
        gender: patient.gender || "male",
        bloodGroup: patient.bloodGroup || "O+",
        phone: patient.phone || patient.userId?.phone || "N/A",
        email: patient.userId?.email || "",
        avatar: patient.userId?.avatar,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        insurance: patient.insurance,
        allergies: patient.allergies || [],
        primaryDoctor: patient.primaryDoctorId
          ? {
              name: patient.primaryDoctorId.name,
              specialty: patient.primaryDoctorId.specialty,
              roomNumber: patient.primaryDoctorId.roomNumber,
            }
          : null,
      },
      todayVisit: todayQueue
        ? {
            ticketNumber: todayQueue.ticketNumber,
            status: todayQueue.status,
            priority: todayQueue.priority,
            roomNumber: todayQueue.roomNumber,
            checkedInTime: todayQueue.checkedInTime,
            reason:
              (todayQueue.appointmentId as any)?.reason ||
              todayQueue.notes ||
              "Outpatient Consultation",
          }
        : null,
      nursingAssessment: nursingAssessment
        ? {
            _id: nursingAssessment._id.toString(),
            status: nursingAssessment.status,
            nurseName: nursingAssessment.nurseName,
            vitals: nursingAssessment.vitals || {},
            chiefComplaint: nursingAssessment.chiefComplaint,
            symptoms: nursingAssessment.symptoms || [],
            painLocation: nursingAssessment.painLocation,
            painCharacteristics: nursingAssessment.painCharacteristics,
            observations: nursingAssessment.observations,
            condition: nursingAssessment.condition,
            mobility: nursingAssessment.mobility,
            triagePriority: nursingAssessment.triagePriority,
            doctorHandoffNotes: nursingAssessment.doctorHandoffNotes,
            generalNotes: nursingAssessment.generalNotes,
            recordedAt:
              nursingAssessment.vitals?.recordedAt ||
              nursingAssessment.createdAt,
          }
        : null,
      previousConsultations: visits.map((v: any) => ({
        _id: v._id.toString(),
        date: v.visitDate,
        doctorName: v.doctorId?.name || "Attending Physician",
        specialty: v.doctorId?.specialty || "Medicine",
        diagnosis: v.diagnosis,
        reason: v.reason,
        summary: v.summary,
        vitals: v.vitals,
      })),
      prescriptions: prescriptions.map((p: any) => ({
        _id: p._id.toString(),
        date: p.date || p.createdAt,
        doctorName: p.doctorId?.name || "Attending Physician",
        status: p.status,
        medications: p.medications || [],
        notes: p.notes,
      })),
      verifiedLabReports: labReports.map((l: any) => ({
        _id: l._id.toString(),
        testName: l.testName,
        department: l.department,
        sampleCollectionDate: l.sampleCollectionDate,
        verifiedDate: l.verifiedDate,
        status: l.status,
        summary: l.summary,
        verifiedBy: l.verifiedBy,
        results: l.results || [],
      })),
      medicalRecords: medicalRecords.map((m: any) => ({
        _id: m._id.toString(),
        title: m.title,
        category: m.category,
        recordDate: m.recordDate,
        facility: m.facility,
        summary: m.summary,
      })),
      recentConsultationDrafts: consultations.map((c: any) => ({
        _id: c._id.toString(),
        status: c.status,
        chiefComplaint: c.chiefComplaint,
        diagnosis: c.diagnosis,
        startedAt: c.startedAt,
        completedAt: c.completedAt,
      })),
    });
  } catch (error: any) {
    console.error("Doctor patient details API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load patient clinical profile" },
      { status: 500 }
    );
  }
}
