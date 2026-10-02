import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { Prescription, Medicine, DispensingRecord } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    // 1. Pending prescriptions count
    const pendingPrescriptionsCount = await Prescription.countDocuments({
      status: "pending",
    });

    // 2. Ready for dispensing count
    const readyForDispensingCount = await Prescription.countDocuments({
      status: { $in: ["ready", "reviewed"] },
    });

    // 3. Low stock medicines count
    const lowStockMedicinesCount = await Medicine.countDocuments({
      status: { $in: ["low_stock", "out_of_stock"] },
    });

    // 4. Today's dispensing count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayDispensingCount = await DispensingRecord.countDocuments({
      dispensedDate: { $gte: startOfToday },
    });

    // Total completed history
    const completedHistoryCount = await DispensingRecord.countDocuments({
      status: "completed",
    });

    // In-progress dispensing count
    const inProgressDispensingCount = await DispensingRecord.countDocuments({
      status: { $in: ["preparing", "dispensed"] },
    });

    const getPatientName = (patient: any) => {
      if (!patient) return "Patient";
      if (patient.userId && typeof patient.userId === "object" && patient.userId.name) {
        return patient.userId.name;
      }
      if (patient.firstName || patient.lastName) {
        return `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
      }
      return patient.name || "Patient";
    };

    // Fetch lists
    // A. Pending prescriptions (created by doctors)
    const rawPendingPrescriptions = await Prescription.find({
      status: "pending",
    })
      .populate({
        path: "patientId",
        select: "firstName lastName mrn gender dateOfBirth bloodGroup userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty department")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const pendingPrescriptions = rawPendingPrescriptions.map((rx: any) => {
      if (rx.patientId) rx.patientId.name = getPatientName(rx.patientId);
      return rx;
    });

    // B. Ready for dispensing prescriptions
    const rawReadyPrescriptions = await Prescription.find({
      status: { $in: ["ready", "reviewed"] },
    })
      .populate({
        path: "patientId",
        select: "firstName lastName mrn gender dateOfBirth bloodGroup userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty department")
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    const readyPrescriptions = rawReadyPrescriptions.map((rx: any) => {
      if (rx.patientId) rx.patientId.name = getPatientName(rx.patientId);
      return rx;
    });

    // C. Low-stock medicines
    const lowStockMedicines = await Medicine.find({
      status: { $in: ["low_stock", "out_of_stock"] },
    })
      .sort({ availableQuantity: 1 })
      .limit(6)
      .lean();

    // D. Today's dispensing
    const rawTodayDispensing = await DispensingRecord.find({
      dispensedDate: { $gte: startOfToday },
    })
      .populate({
        path: "patientId",
        select: "firstName lastName mrn gender userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty")
      .populate("prescriptionId")
      .sort({ dispensedDate: -1 })
      .limit(6)
      .lean();

    const todayDispensing = rawTodayDispensing.map((d: any) => {
      if (d.patientId) d.patientId.name = getPatientName(d.patientId);
      return d;
    });

    // E. Recent Activity timeline
    const rawRecentDispensing = await DispensingRecord.find({})
      .populate({
        path: "patientId",
        select: "firstName lastName userId",
        populate: { path: "userId", select: "name" },
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const rawRecentClarifications = await Prescription.find({
      status: "clarification_requested",
    })
      .populate({
        path: "patientId",
        select: "firstName lastName userId",
        populate: { path: "userId", select: "name" },
      })
      .populate("doctorId", "name")
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentActivity = [
      ...rawRecentDispensing.map((d: any) => ({
        id: d._id.toString(),
        type: "dispense",
        title: `Dispensed: ${d.dispenseId}`,
        description: `Dispensed to patient ${getPatientName(d.patientId)} by ${d.pharmacistName}`,
        time: d.dispensedDate || d.updatedAt,
        status: d.status,
      })),
      ...rawRecentClarifications.map((c: any) => ({
        id: c._id.toString(),
        type: "clarification",
        title: `Clarification Requested`,
        description: `Contacted Dr. ${(c.doctorId as any)?.name || "Doctor"} for ${getPatientName(c.patientId)}: ${c.clarificationReason || "Dose verification"}`,
        time: c.updatedAt,
        status: "clarification_requested",
      })),
    ].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    ).slice(0, 7);

    return NextResponse.json({
      success: true,
      stats: {
        pendingPrescriptionsCount,
        readyForDispensingCount,
        lowStockMedicinesCount,
        todayDispensingCount,
        completedHistoryCount,
        inProgressDispensingCount,
      },
      pendingPrescriptions,
      readyPrescriptions,
      lowStockMedicines,
      todayDispensing,
      recentActivity,
    });
  } catch (error: any) {
    console.error("Pharmacy dashboard API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load pharmacy dashboard" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}
