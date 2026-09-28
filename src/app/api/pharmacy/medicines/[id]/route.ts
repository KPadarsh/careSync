import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { Medicine, DispensingRecord } from "@/models";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const { id } = await context.params;

    const medicine = await Medicine.findById(id).lean();
    if (!medicine) {
      return NextResponse.json(
        { error: "Medicine not found in catalog" },
        { status: 404 }
      );
    }

    // Find dispensing records referencing this medicine
    const dispensingHistory = await DispensingRecord.find({
      $or: [
        { "items.medicineId": medicine._id },
        { "items.medicineName": { $regex: medicine.name.split(" ")[0], $options: "i" } },
      ],
    })
      .populate("patientId", "name mrn gender")
      .populate("doctorId", "name specialty")
      .sort({ dispensedDate: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      medicine,
      dispensingHistory,
    });
  } catch (error: any) {
    console.error("Pharmacy medicine GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch medicine detail" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const { id } = await context.params;
    const body = await req.json();

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return NextResponse.json(
        { error: "Medicine not found" },
        { status: 404 }
      );
    }

    const {
      name,
      genericName,
      category,
      availableQuantity,
      unit,
      lowStockThreshold,
      unitPrice,
      location,
      description,
      stockAdjustment, // e.g. +50 or -10
    } = body;

    if (name !== undefined) medicine.name = name.trim();
    if (genericName !== undefined) medicine.genericName = genericName.trim();
    if (category !== undefined) medicine.category = category.trim();
    if (unit !== undefined) medicine.unit = unit.trim();
    if (location !== undefined) medicine.location = location.trim();
    if (description !== undefined) medicine.description = description.trim();
    if (unitPrice !== undefined) medicine.unitPrice = Number(unitPrice);
    if (lowStockThreshold !== undefined) medicine.lowStockThreshold = Number(lowStockThreshold);

    if (availableQuantity !== undefined) {
      medicine.availableQuantity = Math.max(0, Number(availableQuantity));
    } else if (stockAdjustment !== undefined) {
      medicine.availableQuantity = Math.max(0, medicine.availableQuantity + Number(stockAdjustment));
    }

    // Status is updated in pre-save hook
    await medicine.save();

    return NextResponse.json({
      success: true,
      message: `Stock updated for ${medicine.name}.`,
      medicine,
    });
  } catch (error: any) {
    console.error("Pharmacy medicine PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update medicine" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}
