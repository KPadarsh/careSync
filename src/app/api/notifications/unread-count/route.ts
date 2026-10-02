import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { NotificationService } from "@/services/notification.service";
import { ServiceError } from "@/services/service.error";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const count = await NotificationService.getUnreadCount(user.id);
    return NextResponse.json({
      success: true,
      unreadCount: count,
      count,
    });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("GET /api/notifications/unread-count error:", error);
    return NextResponse.json({ error: "Failed to retrieve unread notification count" }, { status: 500 });
  }
}
