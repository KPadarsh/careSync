import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError, AuthError } from "@/lib/permissions";
import { DoctorService } from "@/services/doctor.service";
import { ServiceError } from "@/services/service.error";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    await requirePermission("doctor.view", req);
    const { id } = await params;

    const doctor = await DoctorService.getDoctorById(id);

    return NextResponse.json({
      success: true,
      doctor,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (error instanceof ServiceError || error instanceof AuthError || err?.statusCode) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 400 });
    }
    return handleAuthError(error, "Failed to load doctor profile");
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
        user = await requirePermission("doctor.activate", req);
      } else {
        user = await requirePermission("doctor.deactivate", req);
      }
    } else {
      user = await requirePermission("doctor.update", req);
    }

    const updated = await DoctorService.updateDoctor(id, body, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      doctor: updated,
      message: "Doctor profile updated successfully",
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (error instanceof ServiceError || error instanceof AuthError || err?.statusCode) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 400 });
    }
    return handleAuthError(error, "Failed to update doctor profile");
  }
}
