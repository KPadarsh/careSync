import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { Notification } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const session = await requireBillingSession();
    await connectToDatabase();

    const notifications = await Notification.find({
      recipientId: session.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipientId: session.user._id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Billing notifications GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireBillingSession();
    await connectToDatabase();

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      await Notification.updateMany(
        { recipientId: session.user._id, isRead: false },
        { isRead: true }
      );
      return NextResponse.json({
        success: true,
        message: "All billing notifications marked as read.",
      });
    }

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      return NextResponse.json({
        success: true,
        message: "Notification marked as read.",
      });
    }

    return NextResponse.json(
      { error: "Invalid parameters" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Billing notifications PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notification" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
