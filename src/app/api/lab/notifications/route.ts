import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";
import { Notification } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireLabSession();
    const userId = session.user._id;

    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
        _id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error: any) {
    console.error("Lab Notifications GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireLabSession();
    const userId = session.user._id;
    const body = await request.json();

    const { notificationId, markAll } = body;

    if (markAll) {
      await Notification.updateMany(
        { recipientId: userId, isRead: false },
        { isRead: true }
      );
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read.",
      });
    }

    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, recipientId: userId },
        { isRead: true }
      );
      return NextResponse.json({
        success: true,
        message: "Notification marked as read.",
      });
    }

    return NextResponse.json(
      { error: "Notification ID or markAll flag required" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Lab Notifications PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}
