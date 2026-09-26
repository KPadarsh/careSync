import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";

// Workstation settings stored in-memory / session-backed for the reception terminal
let terminalSettings = {
  soundNotifications: true,
  defaultLanding: "/reception/dashboard",
  autoRefreshInterval: 30, // seconds
  printWristbandsOnCheckin: true,
  stationName: "Station 01 — Main Entrance Lobby",
  defaultDepartment: "All Departments",
  highContrastQueue: false,
  alertVolume: 80,
  autoCallNextPatient: false,
};

export async function GET() {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    return NextResponse.json({
      success: true,
      settings: terminalSettings,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const body = await req.json();
    terminalSettings = {
      ...terminalSettings,
      ...body,
    };

    return NextResponse.json({
      success: true,
      message: "Workstation terminal settings saved successfully",
      settings: terminalSettings,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Settings PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
