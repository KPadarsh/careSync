import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { Notification } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const session = await requireNurseSession();

    const notifications = await Notification.find({
      recipientId: session.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error("Nurse notifications GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load notifications" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    const session = await requireNurseSession();

    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await Notification.updateMany(
        { recipientId: session.user._id, isRead: false },
        { isRead: true }
      );
      return NextResponse.json({ message: "All notifications marked as read" });
    }

    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, recipientId: session.user._id },
        { isRead: true }
      );
      return NextResponse.json({ message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("Nurse notifications PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
