import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import {
  Appointment,
  Visit,
  Prescription,
  LabReport,
  FollowUp,
  Notification,
  Doctor,
} from "@/models";

interface PopulatedDoctor {
  _id?: unknown;
  name?: string;
  specialty?: string;
  roomNumber?: string;
  avatar?: string;
  department?: string;
}

export async function GET() {
  try {
    await connectToDatabase();
    // Strictly derive patient from authenticated session (Security Rule)
    const { user, patient, patientId } = await requirePatientSession();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Next upcoming appointment
    const nextAppointment = await Appointment.findOne({
      patientId,
      date: { $gte: today },
      status: { $in: ["confirmed", "scheduled"] },
    })
      .sort({ date: 1, timeSlot: 1 })
      .populate("doctorId", "name specialty roomNumber avatar department");

    // 2. Counts
    const upcomingCount = await Appointment.countDocuments({
      patientId,
      date: { $gte: today },
      status: { $in: ["confirmed", "scheduled"] },
    });

    const activeRxCount = await Prescription.countDocuments({
      patientId,
      status: "active",
    });

    const verifiedLabsCount = await LabReport.countDocuments({
      patientId,
      status: "verified",
    });

    // 3. Today's visit (if any)
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const todayVisit = await Visit.findOne({
      patientId,
      visitDate: { $gte: today, $lte: endOfToday },
    })
      .populate("doctorId", "name specialty")
      .select("doctorId reason summary status visitDate");

    // 4. Last historical visit
    const lastVisit = await Visit.findOne({
      patientId,
    })
      .sort({ visitDate: -1 })
      .select("visitDate");

    // 5. Active follow-up instruction
    const activeFollowUp = await FollowUp.findOne({
      patientId,
      status: "pending",
    })
      .populate("doctorId", "name specialty")
      .sort({ recommendedDate: 1 });

    // 6. Recent notifications
    const recentNotifications = await Notification.find({
      recipientId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(4);

    // 7. Patient's assigned primary doctor or first clinical doctor
    let primaryDoctor = null;
    if (patient.primaryDoctorId) {
      primaryDoctor = await Doctor.findById(patient.primaryDoctorId).select(
        "name specialty avatar"
      );
    }
    if (!primaryDoctor) {
      primaryDoctor = await Doctor.findOne().select("name specialty avatar");
    }

    // Calculate age from dateOfBirth
    let age = "32 Years";
    if (patient.dateOfBirth) {
      const diffYears =
        new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
      age = `${diffYears} Years`;
    }

    const nextDoc = nextAppointment?.doctorId as unknown as PopulatedDoctor | undefined;
    const todayDoc = todayVisit?.doctorId as unknown as PopulatedDoctor | undefined;
    const followDoc = activeFollowUp?.doctorId as unknown as PopulatedDoctor | undefined;
    const primDoc = primaryDoctor as unknown as PopulatedDoctor | undefined;

    return NextResponse.json({
      success: true,
      patient: {
        name: user.name,
        mrn: patient.mrn,
        bloodGroup: patient.bloodGroup || "O+",
        age,
        allergies: patient.allergies || [],
        primaryDoctor: primDoc?.name || "Dr. Anjali Menon",
        lastVisit: lastVisit
          ? new Date(lastVisit.visitDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "None recorded",
      },
      stats: {
        upcomingAppointments: upcomingCount,
        activePrescriptions: activeRxCount,
        pendingLabs: verifiedLabsCount,
        outstandingBills: "$1,250",
      },
      nextAppointment: nextAppointment
        ? {
            id: nextAppointment._id.toString(),
            doctorName: nextDoc?.name || "Attending Physician",
            specialty: nextDoc?.specialty || "General Medicine",
            date: new Date(nextAppointment.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
            time: nextAppointment.timeSlot,
            status: nextAppointment.status,
            location:
              nextDoc?.roomNumber ||
              "Consultation Room 302, Main Clinic",
            avatarUrl: nextDoc?.avatar,
          }
        : null,
      todayVisit: todayVisit
        ? {
            id: todayVisit._id.toString(),
            doctorName: todayDoc?.name,
            reason: todayVisit.reason,
            summary: todayVisit.summary,
            status: todayVisit.status,
          }
        : null,
      activeFollowUp: activeFollowUp
        ? {
            id: activeFollowUp._id.toString(),
            doctorName: followDoc?.name,
            recommendedDate: new Date(activeFollowUp.recommendedDate).toLocaleDateString(),
            reason: activeFollowUp.reason,
            instructions: activeFollowUp.clinicalInstructions,
          }
        : null,
      recentActivity: recentNotifications.map((n) => ({
        id: n._id.toString(),
        title: n.title,
        timestamp: new Date(n.createdAt).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status:
          n.type === "lab_report"
            ? "success"
            : n.type === "appointment"
            ? "info"
            : "neutral",
        link: n.link,
      })),
    });
  } catch (error: unknown) {
    console.error("Dashboard API error:", error);
    const errMessage = error instanceof Error ? error.message : "";
    if (errMessage === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
