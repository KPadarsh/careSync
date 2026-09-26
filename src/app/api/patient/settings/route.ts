import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";

export async function GET() {
  try {
    await connectToDatabase();
    await requirePatientSession();

    return NextResponse.json({
      success: true,
      settings: {
        emailNotifications: true,
        smsNotifications: true,
        appointmentReminders: true,
        labResultsAlerts: true,
        twoFactorAuth: false,
        theme: "light",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    await requirePatientSession();
    const body = await req.json();

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
      settings: body,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
