import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import {
  Consultation,
  Patient,
  Doctor,
  Queue,
  NursingAssessment,
  Prescription,
  LabReport,
  FollowUp,
  Visit,
  MedicalRecord,
  Invoice,
  Notification,
  Appointment,
  User,
} from "@/models";
import { NotificationService } from "@/services/notification.service";
import { logAuditEvent } from "@/lib/audit";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Consultation, Queue or Patient ID is required" },
        { status: 400 }
      );
    }

    let consultation: any = null;
    let patient: any = null;
    let queueItem: any = null;

    // 1. Try finding consultation directly
    if (mongoose.Types.ObjectId.isValid(id)) {
      consultation = await Consultation.findById(id).lean();
    }

    // 2. If not found, check if id is a Queue item
    if (!consultation && mongoose.Types.ObjectId.isValid(id)) {
      queueItem = await Queue.findById(id)
        .populate("patientId")
        .populate("appointmentId")
        .lean();

      if (queueItem?.patientId) {
        patient = queueItem.patientId;
      }
    }

    // 3. If not found, check if id is a Patient
    if (!consultation && !patient) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        patient = await Patient.findById(id).lean();
      }
      if (!patient) {
        patient = await Patient.findOne({ mrn: id.toUpperCase() }).lean();
      }
    }

    // If consultation exists, load patient from consultation
    if (consultation && !patient) {
      patient = await Patient.findById(consultation.patientId).lean();
    }

    if (!patient) {
      return NextResponse.json(
        { error: "Could not identify patient for consultation" },
        { status: 404 }
      );
    }

    // Populate patient's user info
    const populatedPatient = await Patient.findById(patient._id)
      .populate("userId", "name email phone avatar")
      .lean();

    // Check for existing draft consultation for this patient
    if (!consultation) {
      consultation = await Consultation.findOne({
        patientId: patient._id,
        doctorId,
        status: "draft",
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    // Load latest Nursing Assessment for live vitals ribbon & triage handoff
    const nursingAssessment = await NursingAssessment.findOne({
      patientId: patient._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    // Find active Queue item if not already found
    if (!queueItem) {
      queueItem = await Queue.findOne({
        patientId: patient._id,
        status: { $in: ["ready-for-doctor", "in-consultation", "waiting"] },
      })
        .populate("appointmentId")
        .lean();
    }

    const patientName =
      (populatedPatient as any)?.userId?.name ||
      `${populatedPatient?.firstName || ""} ${populatedPatient?.lastName || ""}`.trim() ||
      "Patient";

    const age = populatedPatient?.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(populatedPatient.dateOfBirth).getTime()) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : 32;

    // Default template data if consultation is fresh draft
    const chiefComplaint =
      consultation?.chiefComplaint ||
      nursingAssessment?.chiefComplaint ||
      (queueItem?.appointmentId as any)?.reason ||
      queueItem?.notes ||
      "Mild chest discomfort since yesterday evening after physical exertion.";

    const historyOfPresentIllness =
      consultation?.historyOfPresentIllness ||
      "Patient reports intermittent dull retrosternal tightness starting yesterday after climbing 3 flights of stairs. Lasts approx 10-15 mins, subsides with rest. Denies radiation to left arm, jaw, or back. No diaphoresis, shortness of breath, palpitations, or nausea. No prior ischemic cardiac history.";

    const clinicalExamination =
      consultation?.clinicalExamination ||
      "Cardiovascular: S1, S2 present, regular rate and rhythm, no murmurs, gallops, or friction rubs heard. Peripheral pulses (radial, dorsalis pedis) 2+ bilateral equal.\nRespiratory: Bilateral lungs clear to auscultation, vesicular breath sounds throughout, no rales or wheezes.\nGeneral: Conscious, alert, pleasant, oriented x3, in no acute respiratory or hemodynamic distress.";

    const diagnosis =
      consultation?.diagnosis ||
      "Non-cardiac Chest Pain / Atypical Angina";

    const icdCode = consultation?.icdCode || "R07.89";

    const differentialDiagnoses =
      consultation?.differentialDiagnoses && consultation.differentialDiagnoses.length > 0
        ? consultation.differentialDiagnoses
        : ["Rule out Exertional Angina / CAD (I25.10)", "Gastroesophageal Reflux (GERD) (K21.9)"];

    const treatmentPlan =
      consultation?.treatmentPlan ||
      "1. Rest and activity modification; avoid intense isometric strain until diagnostic workup is complete.\n2. Reassurance provided regarding normal baseline vitals and clear cardiopulmonary physical examination.\n3. Proceed with baseline 12-lead ECG, cardiac biomarkers (Troponin I), and fasting lipid profile panel today.\n4. Emergency red flags explained (crushing retrosternal pressure, diaphoresis, radiating pain to left arm or jaw) — seek immediate ER care if symptoms worsen or change.";

    const medications =
      consultation?.medications && consultation.medications.length > 0
        ? consultation.medications
        : [
            {
              medicine: "Sorbitrate (Isosorbide Dinitrate)",
              dosage: "5 mg",
              frequency: "PRN (As needed)",
              duration: "5 days",
              instructions: "Dissolve 1 tablet under tongue if severe chest pain occurs; repeat in 5 mins if no relief.",
            },
            {
              medicine: "Pantoprazole",
              dosage: "40 mg",
              frequency: "Once Daily (Morning)",
              duration: "7 days",
              instructions: "Take 30 minutes before breakfast on an empty stomach.",
            },
          ];

    const labOrders =
      consultation?.labOrders && consultation.labOrders.length > 0
        ? consultation.labOrders
        : [
            {
              testName: "12-Lead ECG",
              reason: "Evaluate ST-T changes with chest discomfort",
              priority: "urgent",
              instructions: "Record resting 12-lead trace before discharge.",
            },
            {
              testName: "Serum Troponin I (hs-cTnI)",
              reason: "Rule out acute coronary syndrome",
              priority: "routine",
              instructions: "Stat blood sample via phlebotomy.",
            },
            {
              testName: "Lipid Profile Panel",
              reason: "Cardiovascular risk stratification",
              priority: "routine",
              instructions: "Fasting sample.",
            },
          ];

    const followUp = consultation?.followUp || {
      needed: true,
      timeframe: "1 week",
      recommendedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      reason: "Follow-up Cardiology Review & Lab Results",
      clinicalInstructions: "Review 12-lead ECG and Troponin-I. Assess response to PRN Sorbitrate.",
    };

    return NextResponse.json({
      consultationId: consultation?._id?.toString() || null,
      status: consultation?.status || "draft",
      patient: {
        _id: populatedPatient?._id?.toString(),
        name: patientName,
        mrn: populatedPatient?.mrn || "MRN-N/A",
        age,
        gender: populatedPatient?.gender || "male",
        bloodGroup: populatedPatient?.bloodGroup || "—",
        allergies: populatedPatient?.allergies || [],
        avatar: (populatedPatient as any)?.userId?.avatar,
      },
      queue: queueItem
        ? {
            _id: queueItem._id.toString(),
            ticketNumber: queueItem.ticketNumber,
            status: queueItem.status,
            priority: queueItem.priority,
            roomNumber: queueItem.roomNumber || session.doctor.roomNumber,
          }
        : null,
      nurseVitals: nursingAssessment
        ? {
            bloodPressure: nursingAssessment.vitals?.bloodPressure || "",
            heartRate: nursingAssessment.vitals?.heartRate,
            oxygenSaturation: nursingAssessment.vitals?.oxygenSaturation,
            temperature: nursingAssessment.vitals?.temperature,
            respiratoryRate: nursingAssessment.vitals?.respiratoryRate,
            weightKg: nursingAssessment.vitals?.weightKg,
            painScore: nursingAssessment.vitals?.painScore,
            notes: nursingAssessment.vitals?.notes || "",
            nurseName: nursingAssessment.nurseName,
            handoffNotes: nursingAssessment.doctorHandoffNotes,
          }
        : null,
      chiefComplaint,
      historyOfPresentIllness,
      clinicalExamination,
      diagnosis,
      icdCode,
      differentialDiagnoses,
      treatmentPlan,
      notes: consultation?.notes || "",
      medications,
      labOrders,
      followUp,
    });
  } catch (error: any) {
    console.error("Doctor consultation GET error:", error);
    const status = error?.statusCode || (error.message?.includes("Forbidden") ? 403 : error.message?.includes("Unauthorized") ? 401 : 500);
    return NextResponse.json(
      { error: error.message || "Failed to load consultation encounter" },
      { status }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;
    const body = await request.json();

    const {
      patientId,
      queueId,
      status, // "draft" | "completed"
      chiefComplaint,
      historyOfPresentIllness,
      clinicalExamination,
      diagnosis,
      icdCode,
      differentialDiagnoses,
      treatmentPlan,
      notes,
      medications,
      labOrders,
      followUp,
      vitals,
    } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(patientId).populate("userId");
    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // 1. Create or update Consultation record
    let consultation = await Consultation.findOne({
      patientId: patient._id,
      doctorId,
      status: "draft",
    });

    if (!consultation) {
      consultation = new Consultation({
        patientId: patient._id,
        doctorId,
        queueId: queueId && mongoose.Types.ObjectId.isValid(queueId) ? queueId : undefined,
        status: status || "draft",
        startedAt: new Date(),
      });
    }

    consultation.chiefComplaint = chiefComplaint || "";
    consultation.historyOfPresentIllness = historyOfPresentIllness || "";
    consultation.clinicalExamination =
      typeof clinicalExamination === "object" && clinicalExamination !== null
        ? Object.entries(clinicalExamination)
            .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`)
            .join("\n")
        : String(clinicalExamination || "");
    consultation.diagnosis = diagnosis || "";
    consultation.icdCode = icdCode || "";
    consultation.differentialDiagnoses = differentialDiagnoses || [];
    consultation.treatmentPlan = treatmentPlan || "";
    consultation.notes = notes || "";
    consultation.medications = medications || [];
    consultation.labOrders = labOrders || [];
    consultation.followUp = followUp || { needed: false };
    if (vitals) consultation.vitals = vitals;

    const finalStatus = status || "completed";
    if (finalStatus === "completed") {
      consultation.status = "completed";
      consultation.completedAt = new Date();
    } else {
      consultation.status = "draft";
    }

    await consultation.save();

    let createdPrescription: any = null;
    let createdLabReports: any[] = [];
    let createdFollowUp: any = null;
    let createdInvoice: any = null;

    // If consultation is being COMPLETED, trigger integrated clinical pipeline:
    if (finalStatus === "completed") {
      // A. Create / Save Prescription for Pharmacy
      if (medications && medications.length > 0) {
        createdPrescription = await Prescription.create({
          patientId: patient._id,
          doctorId,
          visitId: undefined, // will update with visit
          date: new Date(),
          status: "pending",
          medications: medications.map((m: any) => ({
            medicine: m.medicine,
            dosage: m.dosage,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions,
            refillsRemaining: 1,
          })),
          notes: `Authored during consultation on ${new Date().toLocaleDateString()} by ${session.doctor.name}.`,
        });
      }

      // B. Create Lab Requests for Lab Technician
      if (labOrders && labOrders.length > 0) {
        for (const order of labOrders) {
          const lab = await LabReport.create({
            patientId: patient._id,
            doctorId,
            testName: order.testName,
            department: "Pathology / Clinical Chemistry",
            sampleCollectionDate: new Date(),
            status: "pending", // Lab technician collects and processes
            summary: `Clinical Order: ${order.reason || "Diagnostic evaluation"}. Priority: ${order.priority || "routine"}.`,
            verifiedBy: "Pending Lab Processing",
            results: [],
          });
          createdLabReports.push(lab);
        }
      }

      // C. Create Follow-up for Receptionist
      if (followUp?.needed || followUp?.required) {
        const recommendedDate = followUp.recommendedDate
          ? new Date(followUp.recommendedDate)
          : new Date(Date.now() + (followUp.recommendedDays || 14) * 24 * 60 * 60 * 1000);

        createdFollowUp = await FollowUp.create({
          patientId: patient._id,
          doctorId,
          recommendedDate,
          reason: followUp.reason || `Follow-up evaluation for ${diagnosis || "Clinical Review"}`,
          clinicalInstructions:
            followUp.clinicalInstructions ||
            "Check symptom progression, review diagnostic results, and evaluate medication tolerance.",
          status: "pending", // Receptionist can now schedule
        });
      }

      // D. Create Visit Record
      const visit = await Visit.create({
        patientId: patient._id,
        doctorId,
        visitDate: new Date(),
        reason: chiefComplaint || "Clinical Consultation",
        diagnosis: `${diagnosis} ${icdCode ? `(${icdCode})` : ""}`.trim(),
        summary: treatmentPlan || "Consultation encounter completed.",
        internalNotes: notes || clinicalExamination || "",
        status: "completed",
        vitals: vitals || {},
      });

      // Update prescription visitId if created
      if (createdPrescription) {
        createdPrescription.visitId = visit._id;
        await createdPrescription.save();
      }

      // E. Create Immutable Medical Record
      await MedicalRecord.create({
        patientId: patient._id,
        doctorId,
        title: `Consultation Encounter — ${diagnosis || "Cardiology Clinical Review"}`,
        category: "consultation",
        recordDate: new Date(),
        facility: "CareSync Central Clinic • Cardiology Station 4",
        summary: `Diagnosis: ${diagnosis} (${icdCode || "R07.89"})\nChief Complaint: ${chiefComplaint}\nFindings: ${clinicalExamination}\nPlan: ${treatmentPlan}\nSigned by: ${session.doctor.name}, ${session.doctor.qualification}`,
        isStaffOnly: false,
      });

      // F. Update Queue status to "completed" and mark Appointment completed
      let associatedAppointmentId: any = null;
      if (queueId && mongoose.Types.ObjectId.isValid(queueId)) {
        const queueDoc = await Queue.findByIdAndUpdate(
          queueId,
          {
            status: "completed",
            completedTime: new Date(),
          },
          { new: true }
        );
        if (queueDoc?.appointmentId) {
          associatedAppointmentId = queueDoc.appointmentId;
          await Appointment.findByIdAndUpdate(queueDoc.appointmentId, {
            status: "completed",
          });
        }
      } else {
        const queueDoc = await Queue.findOneAndUpdate(
          {
            patientId: patient._id,
            status: { $in: ["ready-for-doctor", "in-consultation"] },
          },
          {
            status: "completed",
            completedTime: new Date(),
          },
          { new: true }
        );
        if (queueDoc?.appointmentId) {
          associatedAppointmentId = queueDoc.appointmentId;
          await Appointment.findByIdAndUpdate(queueDoc.appointmentId, {
            status: "completed",
          });
        }
      }

      if (!associatedAppointmentId) {
        // Fallback: update today's active appointment for this patient/doctor if any
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        await Appointment.findOneAndUpdate(
          {
            patientId: patient._id,
            doctorId,
            date: { $gte: todayStart, $lt: todayEnd },
            status: { $in: ["checked-in", "in-progress", "confirmed"] },
          },
          { status: "completed" }
        );
      }

      // G. Generate Billable Invoice for Billing Department
      const patientUser = (patient as any)?.userId?.name || `${patient.firstName || ""} ${patient.lastName || ""}`.trim() || "Patient";
      const billableServices: any[] = [
        {
          serviceName: `Outpatient Specialist Consultation (${session.doctor.specialty || "Clinical Medicine"})`,
          category: "consultation",
          quantity: 1,
          unitPrice: 150.0,
          subtotal: 150.0,
          notes: `Attending Physician: Dr. ${session.doctor.name}`,
        },
      ];

      if (createdPrescription && medications && medications.length > 0) {
        billableServices.push({
          serviceName: `Pharmacy Formulary Dispensing (${medications.length} Rx Items)`,
          category: "pharmacy",
          quantity: 1,
          unitPrice: 35.0 * medications.length,
          subtotal: 35.0 * medications.length,
          notes: `Prescribed: ${medications.map((m: any) => m.medicine).join(", ")}`,
        });
      }

      if (createdLabReports && createdLabReports.length > 0) {
        billableServices.push({
          serviceName: `Clinical Pathology Diagnostic Panel (${createdLabReports.length} Tests)`,
          category: "laboratory",
          quantity: 1,
          unitPrice: 65.0 * createdLabReports.length,
          subtotal: 65.0 * createdLabReports.length,
          notes: `Ordered: ${createdLabReports.map((l: any) => l.testName).join(", ")}`,
        });
      }

      const subtotalAmount = billableServices.reduce((acc, s) => acc + s.subtotal, 0);
      const invCount = await Invoice.countDocuments();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 105).padStart(5, "0")}`;

      createdInvoice = await Invoice.create({
        invoiceNumber,
        patientId: patient._id,
        doctorId,
        date: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        services: billableServices,
        subtotalAmount,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: subtotalAmount,
        paidAmount: 0,
        balanceAmount: subtotalAmount,
        status: "pending",
        notes: `Generated on completion of consultation encounter with Dr. ${session.doctor.name}.`,
        createdBy: session.user._id,
        createdByName: `Dr. ${session.doctor.name}`,
      });

      // H. Cross-Portal Realtime Notifications Dispatch via NotificationService
      // 1. Notify Pharmacy Staff if prescriptions exist
      if (createdPrescription && medications && medications.length > 0) {
        try {
          await NotificationService.notifyRole("PHARMACIST", {
            title: "New Prescription Authored",
            message: `Dr. ${session.doctor.name} issued prescription for ${patientUser} (${medications.length} items).`,
            type: "prescription",
            link: "/pharmacy/prescriptions",
            relatedResource: {
              resourceType: "prescription",
              resourceId: createdPrescription._id.toString(),
            },
          });
        } catch (notifErr) {
          console.error("Failed to notify pharmacy:", notifErr);
        }
      }

      // 2. Notify Lab Technicians if lab orders exist
      if (createdLabReports && createdLabReports.length > 0) {
        try {
          await NotificationService.notifyRole("LAB_TECHNICIAN", {
            title: `New Lab Requisition (${createdLabReports.length} test${createdLabReports.length > 1 ? "s" : ""})`,
            message: `Dr. ${session.doctor.name} ordered diagnostic testing for ${patientUser}. Requisition awaiting specimen collection.`,
            type: "lab_report",
            link: "/lab/requests",
          });
        } catch (notifErr) {
          console.error("Failed to notify lab technicians:", notifErr);
        }
      }

      // 3. Notify Billing Specialists of generated invoice
      try {
        await NotificationService.notifyRole("BILLING_STAFF", {
          title: `New Billable Encounter (${invoiceNumber})`,
          message: `Encounter completed for ${patientUser}. Total Billed: $${subtotalAmount.toFixed(2)}.`,
          type: "billing",
          link: "/billing/invoices",
          relatedResource: {
            resourceType: "invoice",
            resourceId: createdInvoice._id.toString(),
          },
        });
      } catch (notifErr) {
        console.error("Failed to notify billing:", notifErr);
      }

      // 4. Notify Patient of completed consultation & new invoice
      try {
        if (patient.userId) {
          const docName = session.doctor.name.startsWith("Dr.")
            ? session.doctor.name
            : `Dr. ${session.doctor.name}`;

          await NotificationService.createNotification({
            recipientUserId: patient.userId,
            title: "Consultation Completed",
            message: `Your consultation with ${docName} is complete. Treatment plan and clinical orders are ready.`,
            type: "appointment",
            link: "/patient/dashboard",
            relatedResource: {
              resourceType: "consultation",
              resourceId: consultation._id.toString(),
            },
          });

          await NotificationService.createNotification({
            recipientUserId: patient.userId,
            title: `New Invoice Available (${invoiceNumber})`,
            message: `Invoice for $${subtotalAmount.toFixed(2)} has been issued for your consultation.`,
            type: "billing",
            link: "/patient/billing",
            relatedResource: {
              resourceType: "invoice",
              resourceId: createdInvoice._id.toString(),
            },
          });
        }
      } catch (notifErr) {
        console.error("Failed to notify patient:", notifErr);
      }

      // I. Record Server-Side Audit Log
      await logAuditEvent({
        actor: {
          userId: session.user._id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        },
        action: "CONSULTATION_FINALIZED",
        resource: `Consultation Encounter for Patient ${patient.mrn} by Dr. ${session.doctor.name}`,
        resourceType: "consultation",
        metadata: {
          consultationId: consultation._id,
          patientId: patient._id,
          prescriptionId: createdPrescription?._id,
          labReportsCount: createdLabReports.length,
          invoiceId: createdInvoice._id,
          invoiceNumber: createdInvoice.invoiceNumber,
          totalAmount: subtotalAmount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message:
        status === "completed"
          ? "Consultation encounter finalized and signed successfully."
          : "Consultation draft saved successfully.",
      consultationId: consultation._id.toString(),
      status: consultation.status,
      prescriptionId: createdPrescription?._id?.toString() || null,
      invoiceId: createdInvoice?._id?.toString() || null,
      invoiceNumber: createdInvoice?.invoiceNumber || null,
      labOrdersCreated: createdLabReports.length,
      followUpId: createdFollowUp?._id?.toString() || null,
    });
  } catch (error: any) {
    console.error("Doctor consultation POST error:", error);
    const status = error?.statusCode || (error.message?.includes("Forbidden") ? 403 : error.message?.includes("Unauthorized") ? 401 : 500);
    return NextResponse.json(
      { error: error.message || "Failed to process consultation" },
      { status }
    );
  }
}
