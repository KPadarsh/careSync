import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { AuditLog } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const resourceType = searchParams.get("resourceType") || "";
    const status = searchParams.get("status") || "";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query: any = {};
    if (resourceType && resourceType !== "all") query.resourceType = resourceType;
    if (status && status !== "all") query.status = status;

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { resource: { $regex: search, $options: "i" } },
        { "actor.name": { $regex: search, $options: "i" } },
        { "actor.email": { $regex: search, $options: "i" } },
      ];
    }

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();

    return NextResponse.json({
      success: true,
      logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load audit logs" },
      { status: error.message === "UNAUTHORIZED_ADMIN" ? 403 : 500 }
    );
  }
}
