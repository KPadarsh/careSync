import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotificationRelatedResource {
  resourceType?: string;
  resourceId?: string;
}

export interface INotification extends Document {
  recipientUserId?: Types.ObjectId;
  recipientId?: Types.ObjectId; // Backwards compatibility
  title: string;
  message: string;
  type: string;
  relatedResource?: INotificationRelatedResource;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      default: "system",
      trim: true,
      index: true,
    },
    relatedResource: {
      resourceType: { type: String, trim: true },
      resourceId: { type: String, trim: true },
    },
    link: { type: String, trim: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

// Pre-save synchronization hook
NotificationSchema.pre<INotification>("save", function () {
  if (!this.recipientUserId && this.recipientId) {
    this.recipientUserId = this.recipientId;
  }
  if (!this.recipientId && this.recipientUserId) {
    this.recipientId = this.recipientUserId;
  }
});

NotificationSchema.index({ recipientUserId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
