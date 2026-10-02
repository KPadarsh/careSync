import { connectToDatabase } from "@/lib/db";
import { AuditLog, AuditResourceType } from "@/models/AuditLog";

export interface LogAuditOptions {
  actor?: {
    userId?: any;
    name?: string;
    email?: string;
    role?: string;
  };
  action: string;
  resource: string;
  resourceType: AuditResourceType;
  ipAddress?: string;
  userAgent?: string;
  status?: "success" | "warning" | "failure";
  metadata?: Record<string, any>;
}

export async function logAuditEvent(options: LogAuditOptions) {
  try {
    await connectToDatabase();
    await AuditLog.create({
      actor: {
        userId: options.actor?.userId,
        name: options.actor?.name || "System Admin",
        email: options.actor?.email || "admin@caresync.com",
        role: options.actor?.role || "admin",
      },
      action: options.action,
      resource: options.resource,
      resourceType: options.resourceType,
      ipAddress: options.ipAddress || "127.0.0.1",
      userAgent: options.userAgent || "CareSync Admin Portal",
      status: options.status || "success",
      metadata: options.metadata || {},
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

export const logAudit = logAuditEvent;
