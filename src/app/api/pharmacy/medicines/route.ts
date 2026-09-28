import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { Medicine } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const query: any = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { genericName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }

    const medicines = await Medicine.find(query).sort({ name: 1 }).lean();

    // Distinct categories for filter dropdown
    const categories = await Medicine.distinct("category");

    // Summary counts
    const inStockCount = await Medicine.countDocuments({ status: "in_stock" });
    const lowStockCount = await Medicine.countDocuments({ status: "low_stock" });
    const outOfStockCount = await Medicine.countDocuments({ status: "out_of_stock" });

    return NextResponse.json({
      success: true,
      medicines,
      categories,
      counts: {
        total: medicines.length,
        inStock: inStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
    });
  } catch (error: any) {
    console.error("Pharmacy medicines GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch medicines inventory" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const body = await req.json();
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
    } = body;

    if (!name || availableQuantity === undefined || lowStockThreshold === undefined) {
      return NextResponse.json(
        { error: "Medicine name, available quantity, and low-stock threshold are required." },
        { status: 400 }
      );
    }

    const qty = Number(availableQuantity);
    const threshold = Number(lowStockThreshold);

    let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
    if (qty <= 0) status = "out_of_stock";
    else if (qty <= threshold) status = "low_stock";

    const medicine = await Medicine.create({
      name: name.trim(),
      genericName: genericName?.trim(),
      category: category?.trim() || "General",
      availableQuantity: qty,
      unit: unit?.trim() || "tablets",
      lowStockThreshold: threshold,
      status,
      unitPrice: Number(unitPrice) || 0,
      location: location?.trim() || "Main Dispensary",
      description: description?.trim(),
    });

    return NextResponse.json({
      success: true,
      message: `${medicine.name} added to inventory.`,
      medicine,
    });
  } catch (error: any) {
    console.error("Pharmacy medicines POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create medicine item" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}
