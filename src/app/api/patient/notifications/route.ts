import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { Notification } from "@/models/Notification";

export async function GET() {
  try {
    await connectToDatabase();
    const { user } = await requirePatientSession();

    // Patient-specific notifications only (recipientId: user._id)
    const notifications = await Notification.find({
      recipientId: user._id,
    }).sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Fetch notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user } = await requirePatientSession();

    const body = await req.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await Notification.updateMany(
        { recipientId: user._id, isRead: false },
        { isRead: true }
      );
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (id) {
      await Notification.findOneAndUpdate(
        { _id: id, recipientId: user._id },
        { isRead: true }
      );
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update notification error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
