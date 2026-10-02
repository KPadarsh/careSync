import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { Notification } from "@/models";

export async function GET() {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const notifications = await Notification.find({
      recipientId: session.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Error fetching admin notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    await connectToDatabase();

    const body = await req.json();
    const { id, action } = body;

    if (action === "mark_all_read") {
      await Notification.updateMany(
        { recipientId: session.user._id },
        { isRead: true }
      );
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (id) {
      await Notification.findByIdAndUpdate(id, { isRead: true });
      return NextResponse.json({ success: true, message: "Notification marked as read" });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notification" },
      { status: 500 }
    );
  }
}
