import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handleAuthError, AuthError } from "@/lib/permissions";
import { StaffService } from "@/services/staff.service";
import { ServiceError } from "@/services/service.error";

export async function GET(req: NextRequest) {
  try {
    await requirePermission("staff.view", req);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") || undefined;
    const department = searchParams.get("department") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const result = await StaffService.listStaff({
      search,
      role,
      department,
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
    return handleAuthError(error, "Failed to load staff list");
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("[POST /api/admin/staff] cookies:", req.cookies.getAll());
    const user = await requirePermission("staff.create", req);
    console.log("[POST /api/admin/staff] user resolved:", user?.email, user?.role);
    const body = await req.json();

    const staff = await StaffService.createStaff(body, {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        staff,
        message: "Staff member created successfully",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("POST /api/admin/staff error:", error);
    const err = error as { statusCode?: number; message?: string; name?: string; code?: number };
    if (
      error instanceof ServiceError ||
      error instanceof AuthError ||
      err?.name === "ServiceError" ||
      err?.name === "AuthError" ||
      typeof err?.statusCode === "number"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: err.message || "Operation failed",
          fieldErrors: (err as any)?.fieldErrors,
        },
        { status: err.statusCode || 400 }
      );
    }
    if (err?.code === 11000) {
      return NextResponse.json({ success: false, error: "A staff or user record with these details already exists." }, { status: 409 });
    }
    if (err?.name === "ValidationError") {
      return NextResponse.json({ success: false, error: err.message || "Validation failed" }, { status: 400 });
    }
    return handleAuthError(error, "Failed to create staff member");
  }
}
