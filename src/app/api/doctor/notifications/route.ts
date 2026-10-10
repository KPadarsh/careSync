import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession, getAuthStatusCode } from "@/lib/auth";
import { NotificationService } from "@/services/notification.service";
import { ServiceError } from "@/services/service.error";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const userId = session.user._id.toString();

    const { searchParams } = new URL(req.url);
    const unreadOnly =
      searchParams.get("unread") === "true" ||
      searchParams.get("unreadOnly") === "true";
    const type = searchParams.get("type") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const data = await NotificationService.getNotifications(userId, {
      unreadOnly,
      type,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      notifications: data.notifications.map((n: any) => ({
        _id: (n._id || n.id).toString(),
        id: (n._id || n.id).toString(),
        title: n.title,
        message: n.message,
        type: n.type || "system",
        link: n.link || "/doctor/dashboard",
        isRead: !!n.isRead,
        createdAt: n.createdAt,
        relatedResource: n.relatedResource,
      })),
      total: data.total,
      unreadCount: data.unreadCount,
    });
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Doctor notifications GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load notifications" },
      { status: getAuthStatusCode(error) }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const userId = session.user._id.toString();
    const body = await request.json().catch(() => ({}));

    const { notificationId, id, markAll, markAllRead } = body;

    if (markAll || markAllRead) {
      const result = await NotificationService.markAllAsRead(userId);
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
        modifiedCount: result.modifiedCount,
      });
    }

    const targetId = notificationId || id;
    if (targetId) {
      const notification = await NotificationService.markAsRead(targetId, userId);
      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
        notification,
      });
    }

    return NextResponse.json({ error: "Invalid notification request" }, { status: 400 });
  } catch (error: any) {
    if (error instanceof ServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("Doctor notifications PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: getAuthStatusCode(error) }
    );
  }
}
