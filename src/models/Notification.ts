import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
  recipientId: Types.ObjectId; // User ID
  title: string;
  message: string;
  type: "appointment" | "prescription" | "lab_report" | "follow_up" | "system";
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["appointment", "prescription", "lab_report", "follow_up", "system"],
      default: "system",
    },
    link: { type: String },
    isRead: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);
