import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { Prescription, Patient } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const query: any = {};

    if (status && status !== "all") {
      if (status === "ready") {
        query.status = { $in: ["ready", "reviewed"] };
      } else {
        query.status = status;
      }
    }

    if (search) {
      // Find matching patient IDs
      const matchingPatients = await Patient.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const patientIds = matchingPatients.map((p) => p._id);

      query.$or = [
        { patientId: { $in: patientIds } },
        { "medications.medicine": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const prescriptions = await Prescription.find(query)
      .populate("patientId", "name mrn gender dateOfBirth bloodGroup phone allergies")
      .populate("doctorId", "name specialty department qualification")
      .populate("dispensingRecordId")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      prescriptions,
      total: prescriptions.length,
    });
  } catch (error: any) {
    console.error("Pharmacy prescriptions GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch prescriptions" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // CRITICAL PERMISSION: Pharmacist cannot create clinical prescriptions
  return NextResponse.json(
    {
      error:
        "Forbidden: Pharmacists cannot create doctor prescriptions. Only authorized physicians may issue prescriptions.",
    },
    { status: 403 }
  );
}
