import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { DispensingRecord, Prescription, Patient, User } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim();

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const matchingUsers = await User.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

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
        { dispenseId: { $regex: search, $options: "i" } },
        { patientId: { $in: patientIds } },
        { "items.medicineName": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const rawDispensingRecords = await DispensingRecord.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn gender dateOfBirth bloodGroup userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty department")
      .populate("prescriptionId")
      .sort({ updatedAt: -1 })
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

    const dispensingRecords = rawDispensingRecords.map((rec: any) => {
      if (rec.patientId) {
        rec.patientId.name = getPatientName(rec.patientId);
      }
      return rec;
    });

    return NextResponse.json({
      success: true,
      dispensingRecords,
      total: dispensingRecords.length,
    });
  } catch (error: any) {
    console.error("Pharmacy dispensing list GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dispensing records" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePharmacySession();
    await connectToDatabase();

    const body = await req.json();
    const { prescriptionId, items, notes } = body;

    if (!prescriptionId) {
      return NextResponse.json(
        { error: "prescriptionId is required" },
        { status: 400 }
      );
    }

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return NextResponse.json(
        { error: "Referenced prescription not found" },
        { status: 404 }
      );
    }

    const count = await DispensingRecord.countDocuments();
    const dispenseId = `DSP-${new Date().getFullYear()}-${String(count + 50).padStart(5, "0")}`;

    const record = await DispensingRecord.create({
      dispenseId,
      prescriptionId: prescription._id,
      patientId: prescription.patientId,
      doctorId: prescription.doctorId,
      pharmacistId: session.user._id,
      pharmacistName: session.user.name || "Pharmacist",
      items: items || prescription.medications.map((m) => ({
        medicineName: m.medicine,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        quantityDispensed: 10,
        unit: "tablets",
        instructions: m.instructions,
      })),
      dispensedDate: new Date(),
      status: "preparing",
      notes: notes || "Initiated at dispensing bench.",
    });

    prescription.status = "dispensing";
    prescription.dispensingRecordId = record._id as any;
    await prescription.save();

    return NextResponse.json({
      success: true,
      dispenseId: record.dispenseId,
      record,
    });
  } catch (error: any) {
    console.error("Pharmacy dispensing POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create dispensing record" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}
