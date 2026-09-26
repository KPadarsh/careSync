import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";

// Workstation memory settings (in a production setting these could be stored in a Settings model or user metadata)
let nurseWorkstationSettings = {
  stationId: "STATION-3A",
  stationName: "Triage Station 3A - Main Clinic",
  roomAssignment: "Room 302",
  autoRefreshIntervalSeconds: 30,
  audioAlertsEnabled: true,
  criticalVitalsThresholds: {
    systolicHigh: 140,
    systolicLow: 90,
    diastolicHigh: 90,
    diastolicLow: 60,
    heartRateHigh: 100,
    heartRateLow: 50,
    spo2Low: 94,
    temperatureHigh: 100.4,
  },
  theme: "clinical-teal",
  compactQueueView: false,
};

export async function GET() {
  try {
    await connectToDatabase();
    await requireNurseSession();

    return NextResponse.json({ settings: nurseWorkstationSettings });
  } catch (error: any) {
    console.error("Nurse settings GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load settings" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const body = await request.json();
    nurseWorkstationSettings = {
      ...nurseWorkstationSettings,
      ...body,
      criticalVitalsThresholds: {
        ...nurseWorkstationSettings.criticalVitalsThresholds,
        ...(body.criticalVitalsThresholds || {}),
      },
    };

    return NextResponse.json({
      message: "Workstation settings updated successfully",
      settings: nurseWorkstationSettings,
    });
  } catch (error: any) {
    console.error("Nurse settings PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update settings" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
