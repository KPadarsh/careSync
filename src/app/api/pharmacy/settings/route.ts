import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const settings = {
      dispensaryStation: "Counter B - Outpatient Central Pharmacy",
      autoCheckInventory: true,
      soundAlertsOnNewRx: true,
      requireBatchScan: false,
      defaultDaysSupply: 30,
      labelPrinter: "Zebra ZD421 Direct Thermal (IP 192.168.1.185)",
      lowStockEmailAlerts: true,
      lowStockAlertThresholdPercent: 20,
      autoReserveStockOnReview: true,
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error("Pharmacy settings GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const body = await req.json();

    return NextResponse.json({
      success: true,
      message: "Pharmacy station settings saved successfully.",
      settings: body,
    });
  } catch (error: any) {
    console.error("Pharmacy settings PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}
