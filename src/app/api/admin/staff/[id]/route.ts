import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError, AuthError } from "@/lib/permissions";
import { StaffService } from "@/services/staff.service";
import { ServiceError } from "@/services/service.error";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    await requirePermission("staff.view", req);
    const { id } = await params;

    const staff = await StaffService.getStaffById(id);

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (error instanceof ServiceError || error instanceof AuthError || err?.statusCode) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 400 });
    }
    return handleAuthError(error, "Failed to load staff details");
  }
}

export async function PATCH(req: NextRequest, { params }: RouteProps) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Check specific permission if only toggling activation/deactivation
    let user;
    if (body.status && Object.keys(body).length === 1) {
      const norm = String(body.status).toUpperCase();
      if (norm === "ACTIVE") {
        user = await requirePermission("staff.activate", req);
      } else {
        user = await requirePermission("staff.deactivate", req);
      }
    } else {
      user = await requirePermission("staff.update", req);
    }

    const updated = await StaffService.updateStaff(id, body, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      staff: updated,
      message: "Staff member updated successfully",
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (error instanceof ServiceError || error instanceof AuthError || err?.statusCode) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 400 });
    }
    return handleAuthError(error, "Failed to update staff member");
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  try {
    const user = await requirePermission("staff.delete", req);
    const { id } = await params;

    const result = await StaffService.deleteStaff(id, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (error instanceof ServiceError || error instanceof AuthError || err?.statusCode) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 400 });
    }
    return handleAuthError(error, "Failed to delete staff member");
  }
}
