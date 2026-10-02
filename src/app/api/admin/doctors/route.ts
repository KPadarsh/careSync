import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError, AuthError } from "@/lib/permissions";
import { DoctorService } from "@/services/doctor.service";
import { ServiceError } from "@/services/service.error";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("doctor.view", req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const department = searchParams.get("department") || undefined;
    const specialty = searchParams.get("specialty") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const result = await DoctorService.listDoctors({
      search,
      department,
      specialty,
      status,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    if (error instanceof ServiceError || error instanceof AuthError || err?.statusCode) {
      return NextResponse.json({ success: false, error: err.message }, { status: err.statusCode || 400 });
    }
    return handleAuthError(error, "Failed to load doctors");
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission("doctor.create", req);
    const body = await req.json();

    const doctor = await DoctorService.createDoctor(body, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        doctor,
        message: "Doctor created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/admin/doctors error:", error);
    const err = error as { statusCode?: number; message?: string; name?: string; code?: number };
    if (
      error instanceof ServiceError ||
      error instanceof AuthError ||
      err?.name === "ServiceError" ||
      err?.name === "AuthError" ||
      typeof err?.statusCode === "number"
    ) {
      return NextResponse.json({ success: false, error: err.message || "Operation failed" }, { status: err.statusCode || 400 });
    }
    if (err?.code === 11000) {
      return NextResponse.json({ success: false, error: "A doctor or user record with these details already exists." }, { status: 409 });
    }
    if (err?.name === "ValidationError") {
      return NextResponse.json({ success: false, error: err.message || "Validation failed" }, { status: 400 });
    }
    return handleAuthError(error, "Failed to create doctor");
  }
}
