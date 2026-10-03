import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Notification, INotification } from "@/models/Notification";
import { User } from "@/models/User";
import { normalizeRole, AppRole } from "@/lib/permissions";
import { ServiceError } from "./service.error";

const SOCKET_SERVER_URL =
  process.env.INTERNAL_SOCKET_URL ||
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  "http://localhost:3001";
const INTERNAL_REALTIME_SECRET =
  process.env.INTERNAL_REALTIME_SECRET || "caresync_realtime_internal_secret_2026";

export interface CreateNotificationInput {
  recipientId?: string | Types.ObjectId;
  recipientUserId?: string | Types.ObjectId;
  title: string;
  message: string;
  type?: string;
  relatedResource?: {
    resourceType?: string;
    resourceId?: string;
  };
  link?: string;
  targetRole?: AppRole | string;
}

export interface ListNotificationsOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: string;
}

export class NotificationService {
  /**
   * Dispatches a realtime notification event via in-memory Socket.IO or internal HTTP fallback.
   */
  private static async dispatchRealtimeEvent(
    target: { userId?: string; role?: string },
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      // 1. Attempt in-memory broadcast if socket-server is initialized in this process
      const directBroadcast = (globalThis as any).__caresync_broadcast;
      if (typeof directBroadcast === "function") {
        const dispatchedDirectly = directBroadcast(target, payload);
        if (dispatchedDirectly) {
          return;
        }
      }

      // 2. Fallback to standalone Socket.IO server via internal HTTP webhook
      if (process.env.VERCEL && !process.env.INTERNAL_SOCKET_URL && !process.env.NEXT_PUBLIC_SOCKET_URL) {
        return;
      }

      const res = await fetch(`${SOCKET_SERVER_URL}/api/realtime/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-realtime-secret": INTERNAL_REALTIME_SECRET,
        },
        body: JSON.stringify({ target, payload }),
        signal: AbortSignal.timeout(2000),
      }).catch(() => null);

      if (res && !res.ok) {
        console.warn(`[NotificationService] Realtime dispatch HTTP status: ${res.status}`);
      }
    } catch {
      // Realtime emission failure must NEVER compromise database persistence.
      // Notification is securely stored in MongoDB and will synchronize on client pull.
    }
  }

  /**
   * Creates and persists a notification in MongoDB, then publishes it to Socket.IO.
   * Guarantees MongoDB is the authoritative source of truth.
   */
  static async createNotification(input: CreateNotificationInput): Promise<INotification> {
    await connectToDatabase();

    const recipientRaw = input.recipientUserId || input.recipientId;
    if (!recipientRaw) {
      throw new ServiceError("Notification recipient is required", 400);
    }

    if (!input.title || !input.title.trim()) {
      throw new ServiceError("Notification title is required", 400);
    }

    if (!input.message || !input.message.trim()) {
      throw new ServiceError("Notification message is required", 400);
    }

    const recipientObjectId =
      typeof recipientRaw === "string"
        ? new Types.ObjectId(recipientRaw)
        : recipientRaw;

    // 1. Authoritative verification: recipient User must exist and be active
    const recipientUser = await User.findById(recipientObjectId).select("_id status role").lean();
    if (!recipientUser) {
      throw new ServiceError("Recipient user not found", 404);
    }

    const statusNorm = (recipientUser.status || "").toUpperCase();
    if (statusNorm !== "ACTIVE") {
      throw new ServiceError("Cannot send notification to inactive or suspended user", 400);
    }

    // 2. Persist in MongoDB
    const notification = await Notification.create({
      recipientUserId: recipientObjectId,
      recipientId: recipientObjectId,
      title: input.title.trim(),
      message: input.message.trim(),
      type: input.type?.trim() || "system",
      relatedResource: input.relatedResource,
      link: input.link?.trim(),
      isRead: false,
    });

    // 3. Prepare safe payload for realtime delivery (never expose internal secrets or password hashes)
    const safePayload = {
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      relatedResourceType: notification.relatedResource?.resourceType,
      relatedResourceId: notification.relatedResource?.resourceId,
      isRead: false,
      read: false,
      createdAt: notification.createdAt.toISOString(),
    };

    // 4. Publish to target recipient room (and optional role room)
    const targetUserId = recipientObjectId.toString();
    const targetRole = input.targetRole ? normalizeRole(input.targetRole) : undefined;

    await this.dispatchRealtimeEvent(
      {
        userId: targetUserId,
        role: targetRole || undefined,
      },
      safePayload
    );

    return notification;
  }

  /**
   * Creates persistent notifications for all active users of a specific role,
   * guaranteeing that every recipient has an authoritative database record,
   * then publishes real-time socket events to each recipient.
   */
  static async notifyRole(
    role: AppRole | string,
    input: {
      title: string;
      message: string;
      type?: string;
      relatedResource?: { resourceType?: string; resourceId?: string };
      link?: string;
    }
  ): Promise<INotification[]> {
    await connectToDatabase();
    const canonicalRole = normalizeRole(role);
    if (!canonicalRole) {
      throw new ServiceError("Invalid role for notification", 400);
    }

    const activeUsers = (await User.find({
      role: { $in: [canonicalRole, canonicalRole.toLowerCase(), canonicalRole.toUpperCase()] } as any,
      status: { $in: ["active", "ACTIVE"] } as any,
    })
      .select("_id")
      .lean()) as unknown as Array<{ _id: Types.ObjectId }>;

    if (activeUsers.length === 0) {
      return [];
    }

    const createdNotifications: INotification[] = [];

    for (const user of activeUsers) {
      const doc = await Notification.create({
        recipientUserId: user._id,
        recipientId: user._id,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type?.trim() || "system",
        relatedResource: input.relatedResource,
        link: input.link?.trim(),
        isRead: false,
      });
      createdNotifications.push(doc);

      const safePayload = {
        id: doc._id.toString(),
        type: doc.type,
        title: doc.title,
        message: doc.message,
        link: doc.link,
        relatedResourceType: doc.relatedResource?.resourceType,
        relatedResourceId: doc.relatedResource?.resourceId,
        isRead: false,
        read: false,
        createdAt: doc.createdAt.toISOString(),
      };

      await this.dispatchRealtimeEvent(
        { userId: user._id.toString() },
        safePayload
      );
    }

    return createdNotifications;
  }

  /**
   * Retrieves notifications with strict recipient ownership enforcement.
   */
  static async getNotifications(
    userId: string,
    options: ListNotificationsOptions = {}
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ServiceError("Invalid user identifier", 400);
    }

    const userObjectId = new Types.ObjectId(userId);
    const filter: Record<string, unknown> = {
      $or: [{ recipientUserId: userObjectId }, { recipientId: userObjectId }],
    };

    if (options.unreadOnly) {
      filter.isRead = false;
    }

    if (options.type && options.type !== "all") {
      filter.type = options.type;
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 50));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        $or: [{ recipientUserId: userObjectId }, { recipientId: userObjectId }],
        isRead: false,
      }),
    ]);

    return {
      notifications: notifications as unknown as INotification[],
      total,
      unreadCount,
    };
  }

  /**
   * Gets unread notification count for authenticated user.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return 0;
    }

    const userObjectId = new Types.ObjectId(userId);
    return Notification.countDocuments({
      $or: [{ recipientUserId: userObjectId }, { recipientId: userObjectId }],
      isRead: false,
    });
  }

  /**
   * Marks a notification as read with strict ownership check.
   */
  static async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(notificationId) || !mongoose.Types.ObjectId.isValid(userId)) {
      throw new ServiceError("Invalid identifier provided", 400);
    }

    const notifObjectId = new Types.ObjectId(notificationId);
    const userObjectId = new Types.ObjectId(userId);

    const notification = await Notification.findOne({
      _id: notifObjectId,
      $or: [{ recipientUserId: userObjectId }, { recipientId: userObjectId }],
    });

    if (!notification) {
      throw new ServiceError("Notification not found or access denied", 404);
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }

  /**
   * Marks all notifications for a specific user as read.
   */
  static async markAllAsRead(userId: string): Promise<{ success: boolean; modifiedCount: number }> {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ServiceError("Invalid user identifier", 400);
    }

    const userObjectId = new Types.ObjectId(userId);

    const result = await Notification.updateMany(
      {
        $or: [{ recipientUserId: userObjectId }, { recipientId: userObjectId }],
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return {
      success: true,
      modifiedCount: result.modifiedCount,
    };
  }
}
