import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePathologistSession } from "@/lib/auth";
import { Notification } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePathologistSession();
    await connectToDatabase();

    const notifications = await Notification.find({
      recipientId: session.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({
      notifications: notifications.map((n: any) => ({
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        priority: n.priority,
        isRead: n.isRead,
        link: n.link || "/pathologist/reports",
        createdAt: n.createdAt,
      })),
      unreadCount: notifications.filter((n: any) => !n.isRead).length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist notifications error:", error);
    return NextResponse.json(
      { error: "Failed to load notifications." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requirePathologistSession();
    await connectToDatabase();

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await Notification.updateMany(
        { recipientId: session.user._id, isRead: false },
        { isRead: true }
      );
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }

    if (notificationId) {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipientId: session.user._id },
        { isRead: true }
      );
      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "No action specified." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist notifications update error:", error);
    return NextResponse.json(
      { error: "Failed to update notification." },
      { status: 500 }
    );
  }
}
