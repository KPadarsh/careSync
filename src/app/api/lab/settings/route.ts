import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";

// In-memory / session store for workstation preferences
let labWorkstationSettings = {
  stationName: "Central Pathology Station 2",
  defaultAnalyzer: "Roche Cobas 6000 Chemistry Analyzer",
  secondaryAnalyzer: "Sysmex XN-1000 Automated Hematology",
  barcodePrinter: "Zebra ZD421 (2x1 Direct Thermal)",
  autoReferenceRanges: true,
  criticalValueHighlight: true,
  statAudibleAlerts: true,
  autoAccessionBarcode: true,
  defaultSpecimenVolume: "4.0 mL",
  sampleRetentionDays: 7,
};

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabSession();

    return NextResponse.json({ settings: labWorkstationSettings });
  } catch (error: any) {
    console.error("Lab Settings GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load workstation settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabSession();
    const body = await request.json();

    labWorkstationSettings = {
      ...labWorkstationSettings,
      ...body,
    };

    return NextResponse.json({
      success: true,
      message: "Workstation settings updated successfully.",
      settings: labWorkstationSettings,
    });
  } catch (error: any) {
    console.error("Lab Settings PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
