import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";
import { Notification } from "@/models";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user } = await requireReceptionSession();

    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("type");
    const unreadOnly = searchParams.get("unread") === "true";

    const filter: Record<string, unknown> = {
      recipientId: user._id,
    };

    if (filterType && filterType !== "all") {
      filter.type = filterType;
    }
    if (unreadOnly) {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });
    const unreadCount = await Notification.countDocuments({
      recipientId: user._id,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Notifications GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user } = await requireReceptionSession();

    const body = await req.json();
    const { id, all } = body;

    if (all) {
      await Notification.updateMany(
        { recipientId: user._id, isRead: false },
        { $set: { isRead: true } }
      );
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (id && Types.ObjectId.isValid(id)) {
      await Notification.findOneAndUpdate(
        { _id: id, recipientId: user._id },
        { $set: { isRead: true } }
      );
      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      });
    }

    return NextResponse.json({ error: "Notification ID or all flag is required" }, { status: 400 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Notifications PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user } = await requireReceptionSession();

    await Notification.deleteMany({
      recipientId: user._id,
      isRead: true,
    });

    return NextResponse.json({
      success: true,
      message: "Read notifications cleared",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Notifications DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
