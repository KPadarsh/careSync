import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { DispensingRecord, Patient } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const range = searchParams.get("range"); // "today" | "week" | "month" | "all"

    const query: any = {
      status: { $in: ["completed", "dispensed"] },
    };

    if (range === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      query.dispensedDate = { $gte: start };
    } else if (range === "week") {
      const start = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      query.dispensedDate = { $gte: start };
    } else if (range === "month") {
      const start = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      query.dispensedDate = { $gte: start };
    }

    if (search) {
      const matchingPatients = await Patient.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const patientIds = matchingPatients.map((p) => p._id);

      query.$or = [
        { dispenseId: { $regex: search, $options: "i" } },
        { patientId: { $in: patientIds } },
        { "items.medicineName": { $regex: search, $options: "i" } },
        { pharmacistName: { $regex: search, $options: "i" } },
      ];
    }

    const records = await DispensingRecord.find(query)
      .populate("patientId", "name mrn gender dateOfBirth bloodGroup phone")
      .populate("doctorId", "name specialty department")
      .populate("prescriptionId")
      .sort({ dispensedDate: -1 })
      .lean();

    // Summary statistics
    const totalDispensed = records.length;
    const totalMedicationUnits = records.reduce((sum, r) => {
      return (
        sum +
        (r.items || []).reduce(
          (iSum: number, item: any) => iSum + (item.quantityDispensed || 0),
          0
        )
      );
    }, 0);

    return NextResponse.json({
      success: true,
      records,
      stats: {
        totalDispensed,
        totalMedicationUnits,
      },
    });
  } catch (error: any) {
    console.error("Pharmacy history GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dispensing history" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}
