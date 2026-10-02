import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { Prescription, Patient, User } from "@/models";

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
      // Find matching users by name
      const matchingUsers = await User.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      // Find matching patient IDs
      const matchingPatients = await Patient.find({
        $or: [
          { userId: { $in: userIds } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { mrn: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const patientIds = matchingPatients.map((p) => p._id);

      query.$or = [
        { patientId: { $in: patientIds } },
        { "medications.medicine": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const rawPrescriptions = await Prescription.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn gender dateOfBirth bloodGroup phone allergies userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty department qualification")
      .populate("dispensingRecordId")
      .sort({ createdAt: -1 })
      .lean();

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

    const prescriptions = rawPrescriptions.map((rx: any) => {
      if (rx.patientId) {
        rx.patientId.name = getPatientName(rx.patientId);
      }
      return rx;
    });

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
