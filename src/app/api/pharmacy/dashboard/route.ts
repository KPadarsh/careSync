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

    // Fetch lists
    // A. Pending prescriptions (created by doctors)
    const pendingPrescriptions = await Prescription.find({
      status: "pending",
    })
      .populate("patientId", "name mrn gender dateOfBirth bloodGroup")
      .populate("doctorId", "name specialty department")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // B. Ready for dispensing prescriptions
    const readyPrescriptions = await Prescription.find({
      status: { $in: ["ready", "reviewed"] },
    })
      .populate("patientId", "name mrn gender dateOfBirth bloodGroup")
      .populate("doctorId", "name specialty department")
      .sort({ updatedAt: -1 })
      .limit(6)
      .lean();

    // C. Low-stock medicines
    const lowStockMedicines = await Medicine.find({
      status: { $in: ["low_stock", "out_of_stock"] },
    })
      .sort({ availableQuantity: 1 })
      .limit(6)
      .lean();

    // D. Today's dispensing
    const todayDispensing = await DispensingRecord.find({
      dispensedDate: { $gte: startOfToday },
    })
      .populate("patientId", "name mrn gender")
      .populate("doctorId", "name specialty")
      .populate("prescriptionId")
      .sort({ dispensedDate: -1 })
      .limit(6)
      .lean();

    // E. Recent Activity timeline
    const recentDispensing = await DispensingRecord.find({})
      .populate("patientId", "name")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const recentClarifications = await Prescription.find({
      status: "clarification_requested",
    })
      .populate("patientId", "name")
      .populate("doctorId", "name")
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    const recentActivity = [
      ...recentDispensing.map((d: any) => ({
        id: d._id.toString(),
        type: "dispense",
        title: `Dispensed: ${d.dispenseId}`,
        description: `Dispensed to patient ${(d.patientId as any)?.name || "Patient"} by ${d.pharmacistName}`,
        time: d.dispensedDate || d.updatedAt,
        status: d.status,
      })),
      ...recentClarifications.map((c: any) => ({
        id: c._id.toString(),
        type: "clarification",
        title: `Clarification Requested`,
        description: `Contacted Dr. ${(c.doctorId as any)?.name || "Doctor"} for ${(c.patientId as any)?.name || "Patient"}: ${c.clarificationReason || "Dose verification"}`,
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
