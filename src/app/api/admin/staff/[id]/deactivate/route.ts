import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError, AuthError } from "@/lib/permissions";
import { StaffService } from "@/services/staff.service";
import { ServiceError } from "@/services/service.error";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteProps) {
  try {
    const user = await requirePermission("staff.deactivate", req);
    const { id } = await params;

    const staff = await StaffService.deactivateStaff(id, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      staff,
      message: "Staff member deactivated successfully",
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (error instanceof ServiceError || error instanceof AuthError || err?.statusCode) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 400 });
    }
    return handleAuthError(error, "Failed to deactivate staff member");
  }
}
