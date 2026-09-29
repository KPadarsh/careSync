import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAuditLog extends Document {
  actor: {
    userId?: mongoose.Types.ObjectId;
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  resourceType: "staff" | "doctor" | "department" | "schedule" | "user" | "settings" | "system";
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "warning" | "failure";
  metadata?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true, default: "System Admin" },
      email: { type: String, required: true, default: "admin@caresync.com" },
      role: { type: String, required: true, default: "admin" },
    },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true },
    resourceType: {
      type: String,
      required: true,
      enum: ["staff", "doctor", "department", "schedule", "user", "settings", "system"],
      index: true,
    },
    ipAddress: { type: String, default: "127.0.0.1" },
    userAgent: { type: String, default: "Internal CareSync Console" },
    status: {
      type: String,
      enum: ["success", "warning", "failure"],
      default: "success",
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
