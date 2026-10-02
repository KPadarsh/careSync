import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AuditResourceType =
  | "patient"
  | "appointment"
  | "queue"
  | "nursing"
  | "consultation"
  | "prescription"
  | "lab"
  | "pathology"
  | "pharmacy"
  | "dispensing"
  | "invoice"
  | "payment"
  | "staff"
  | "doctor"
  | "department"
  | "schedule"
  | "user"
  | "settings"
  | "system"
  | string;

export interface IAuditActor {
  userId?: Types.ObjectId;
  name: string;
  email: string;
  role: string;
}

export interface IAuditLog extends Document {
  actorUserId?: Types.ObjectId;
  actor?: IAuditActor; // Backwards compatibility
  action: string;
  resource?: string; // Backwards compatibility
  resourceType: AuditResourceType;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status?: "success" | "warning" | "failure";
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    actor: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String, default: "System" },
      email: { type: String, default: "system@caresync.com" },
      role: { type: String, default: "admin" },
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resourceId: {
      type: String,
      trim: true,
      index: true,
    },
    resource: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    userAgent: {
      type: String,
      default: "Internal CareSync Service",
    },
    status: {
      type: String,
      enum: ["success", "warning", "failure"],
      default: "success",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.pre<IAuditLog>("save", function () {
  if (!this.actorUserId && this.actor?.userId) {
    this.actorUserId = this.actor.userId;
  }
  if (!this.resource && this.resourceType) {
    this.resource = `${this.resourceType}:${this.resourceId || ""}`;
  }
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ resourceType: 1, action: 1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
