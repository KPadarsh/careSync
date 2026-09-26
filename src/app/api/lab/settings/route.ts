import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabTechSession } from "@/lib/auth";

export async function GET() {
  try {
    await connectToDatabase();
    await requireLabTechSession();

    return NextResponse.json({
      settings: {
        stationName: "Diagnostic Station A-4",
        autoSyncAnalyzers: true,
        barcodeScannerPrefix: "BC-9812",
        defaultTubeVolume: "4 mL",
        soundAlertsOnStat: true,
        notifyPathologistImmediate: true,
        highlightPanicValues: true,
        storageUnitDefault: "Rack A-1, Main Refrigerator (4°C)",
      },
    });
  } catch (error: any) {
    console.error("Lab settings GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load laboratory settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabTechSession();
    const body = await request.json();

    return NextResponse.json({
      success: true,
      message: "Laboratory technician preferences updated successfully",
      settings: body,
    });
  } catch (error: any) {
    console.error("Lab settings PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
