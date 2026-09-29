import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

// In-memory / persisted system configuration store for the administrative subsystem
let SYSTEM_CONFIG = {
  facilityName: "CareSync Multispecialty Medical Center",
  facilityCode: "CS-MAIN-01",
  timezone: "America/New_York (EST)",
  operatingSchedule: "Monday - Sunday (24/7 Facility Support)",
  defaultShiftDurationHours: 8,
  sessionTimeoutMinutes: 60,
  enforceMfaForStaff: true,
  auditLogRetentionDays: 365,
  allowSelfRegistration: true,
  maintenanceMode: false,
};

export async function GET() {
  try {
    await requireAdminSession();
    return NextResponse.json({
      success: true,
      settings: SYSTEM_CONFIG,
    });
  } catch (error: any) {
    console.error("Error fetching admin settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const body = await req.json();

    const previousConfig = { ...SYSTEM_CONFIG };
    SYSTEM_CONFIG = {
      ...SYSTEM_CONFIG,
      ...body,
    };

    // Server-side audit log
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: "SYSTEM_SETTINGS_UPDATED",
      resource: "CareSync System Infrastructure Settings",
      resourceType: "settings",
      metadata: {
        previous: previousConfig,
        updated: SYSTEM_CONFIG,
      },
    });

    return NextResponse.json({
      success: true,
      settings: SYSTEM_CONFIG,
      message: "System configuration updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating admin settings:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
