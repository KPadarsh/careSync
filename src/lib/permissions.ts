/**
 * CareSync Centralized Role-Based Access Control (RBAC) Architecture
 * 
 * Provides authoritative definitions, permission matrices, server guards,
 * and resource ownership validators across server-side APIs and routing layers.
 */

import { NextResponse } from "next/server";
import { getCurrentUser, SafeUser } from "@/lib/auth";
import { Types } from "mongoose";

// 1. Supported Application Roles (Authoritative in MongoDB User.role)
export const APP_ROLES = [
  "PATIENT",
  "RECEPTIONIST",
  "NURSE",
  "DOCTOR",
  "LAB_TECHNICIAN",
  "PATHOLOGIST",
  "PHARMACIST",
  "BILLING_STAFF",
  "ADMIN",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

// 2. Centralized Granular Workflow Permissions
export const PERMISSIONS = [
  // Staff management (Admin only)
  "staff.view",
  "staff.create",
  "staff.update",
  "staff.activate",
  "staff.deactivate",
  "staff.delete",

  // Doctor administration (Admin only)
  "doctor.view",
  "doctor.create",
  "doctor.update",
  "doctor.activate",
  "doctor.deactivate",

  // Department administration (Admin only)
  "department.view",
  "department.create",
  "department.update",
  "department.activate",
  "department.deactivate",

  // Schedule management (Admin only)
  "schedule.view",
  "schedule.create",
  "schedule.update",
  "schedule.delete",

  // User management (Admin only)
  "user.view",
  "user.update",
  "user.activate",
  "user.deactivate",

  // Patient demographic records (Reception / Clinical / Self)
  "patient.view",
  "patient.create",
  "patient.update",

  // Appointments (Reception / Doctor / Patient)
  "appointment.view",
  "appointment.create",
  "appointment.update",
  "appointment.cancel",
  "appointment.checkin",

  // Outpatient clinic queue (Reception / Nurse / Doctor)
  "queue.view",
  "queue.update",

  // Vitals collection & history (Nurse / Doctor / Patient own)
  "vitals.view",
  "vitals.create",

  // Nursing care and triage assessments (Nurse only)
  "nursingAssessment.view",
  "nursingAssessment.create",
  "nursingAssessment.update",
  "nursingRecord.view",

  // Doctor clinical consultations (Doctor only)
  "consultation.view",
  "consultation.create",
  "consultation.update",

  // Prescriptions (Doctor authors and creates; Doctor owns)
  "prescription.view",
  "prescription.create",

  // Laboratory diagnostics (Lab Tech orders/processes, Doctor requests)
  "labRequest.view",
  "labRequest.create",
  "labSample.view",
  "labSample.create",
  "labSample.update",
  "labResult.view",
  "labResult.create",
  "labResult.update",
  "labResult.submit",

  // Pathology reports (Pathologist reviews and verifies; Doctor / Patient views)
  "pathologyReport.view",
  "pathologyReport.review",
  "pathologyReport.verify",

  // Pharmacy & Dispensing (Pharmacist views prescriptions, dispenses; NO prescription editing)
  "pharmacyPrescription.view",
  "dispensing.view",
  "dispensing.create",
  "medicine.view",
  "medicine.create",
  "medicine.update",

  // Billing & Invoicing (Billing Staff only - strictly NO discharge permissions)
  "invoice.view",
  "invoice.create",
  "invoice.update",
  "payment.view",
  "payment.create",
  "billingHistory.view",
  "outstanding.view",

  // Notifications (User-scoped)
  "notification.view",
  "notification.markRead",

  // System & Security Auditing (Admin only)
  "auditLog.view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

// 3. Authoritative Role-to-Permission Mapping
export const ROLE_PERMISSIONS: Record<AppRole, readonly Permission[]> = {
  // ADMIN: Administrative operations only. NOT ALL_PERMISSIONS. Does not gain clinical permissions.
  ADMIN: [
    "staff.view",
    "staff.create",
    "staff.update",
    "staff.activate",
    "staff.deactivate",
    "staff.delete",
    "doctor.view",
    "doctor.create",
    "doctor.update",
    "doctor.activate",
    "doctor.deactivate",
    "department.view",
    "department.create",
    "department.update",
    "department.activate",
    "department.deactivate",
    "schedule.view",
    "schedule.create",
    "schedule.update",
    "schedule.delete",
    "user.view",
    "user.update",
    "user.activate",
    "user.deactivate",
    "auditLog.view",
    "notification.view",
    "notification.markRead",
  ],

  // RECEPTIONIST: Front desk registration, appointments, check-in, queue viewing.
  RECEPTIONIST: [
    "patient.view",
    "patient.create",
    "patient.update",
    "appointment.view",
    "appointment.create",
    "appointment.update",
    "appointment.cancel",
    "appointment.checkin",
    "queue.view",
    "doctor.view",
    "department.view",
    "schedule.view",
    "notification.view",
    "notification.markRead",
  ],

  // NURSE: Triage, vitals, nursing assessments, patient queue management.
  NURSE: [
    "patient.view",
    "queue.view",
    "queue.update",
    "vitals.view",
    "vitals.create",
    "nursingAssessment.view",
    "nursingAssessment.create",
    "nursingAssessment.update",
    "nursingRecord.view",
    "notification.view",
    "notification.markRead",
  ],

  // DOCTOR: Clinical consultations, prescriptions, lab requests, clinical findings.
  DOCTOR: [
    "patient.view",
    "queue.view",
    "queue.update",
    "consultation.view",
    "consultation.create",
    "consultation.update",
    "prescription.view",
    "prescription.create",
    "labRequest.view",
    "labRequest.create",
    "labResult.view",
    "pathologyReport.view",
    "vitals.view",
    "nursingAssessment.view",
    "nursingRecord.view",
    "appointment.view",
    "doctor.view",
    "schedule.view",
    "notification.view",
    "notification.markRead",
  ],

  // LAB_TECHNICIAN: Phlebotomy tracking, sample accession, test result entry & submission. Cannot verify pathology.
  LAB_TECHNICIAN: [
    "labRequest.view",
    "labSample.view",
    "labSample.create",
    "labSample.update",
    "labResult.view",
    "labResult.create",
    "labResult.update",
    "labResult.submit",
    "notification.view",
    "notification.markRead",
  ],

  // PATHOLOGIST: Reviews lab results, authors findings, verifies pathology reports.
  PATHOLOGIST: [
    "labRequest.view",
    "labSample.view",
    "labResult.view",
    "pathologyReport.view",
    "pathologyReport.review",
    "pathologyReport.verify",
    "patient.view",
    "notification.view",
    "notification.markRead",
  ],

  // PHARMACIST: Reviews doctor prescriptions, dispenses medications, manages formulary stock. Cannot modify doctor prescriptions.
  PHARMACIST: [
    "pharmacyPrescription.view",
    "dispensing.view",
    "dispensing.create",
    "medicine.view",
    "medicine.create",
    "medicine.update",
    "notification.view",
    "notification.markRead",
  ],

  // BILLING_STAFF: Invoicing, payment collection, financial ledgers. Strictly NO discharge workflow.
  BILLING_STAFF: [
    "invoice.view",
    "invoice.create",
    "invoice.update",
    "payment.view",
    "payment.create",
    "billingHistory.view",
    "outstanding.view",
    "patient.view",
    "notification.view",
    "notification.markRead",
  ],

  // PATIENT: Own records only. Must be enforced in conjunction with assertPatientOwnership.
  PATIENT: [
    "patient.view",
    "patient.update",
    "appointment.view",
    "appointment.create",
    "appointment.cancel",
    "prescription.view",
    "labResult.view",
    "pathologyReport.view",
    "consultation.view",
    "vitals.view",
    "notification.view",
    "notification.markRead",
  ],
};

// 4. Role Normalizer
export function normalizeRole(role?: string | null): AppRole | null {
  if (!role) return null;
  const r = role.toUpperCase().trim();
  if (r === "ADMIN" || r === "ADMINISTRATOR") return "ADMIN";
  if (r === "RECEPTION" || r === "RECEPTIONIST") return "RECEPTIONIST";
  if (r === "NURSE") return "NURSE";
  if (r === "DOCTOR" || r === "PHYSICIAN") return "DOCTOR";
  if (r === "LAB" || r === "LAB_TECHNICIAN" || r === "LABORATORY") return "LAB_TECHNICIAN";
  if (r === "PATHOLOGIST" || r === "PATHOLOGY") return "PATHOLOGIST";
  if (r === "PHARMACY" || r === "PHARMACIST") return "PHARMACIST";
  if (r === "BILLING" || r === "BILLING_STAFF") return "BILLING_STAFF";
  if (r === "PATIENT") return "PATIENT";
  return null;
}

// 5. Portal Redirection Helper
export function getPortalRouteForRole(role?: string | null): string {
  const norm = normalizeRole(role);
  switch (norm) {
    case "ADMIN":
      return "/admin/dashboard";
    case "RECEPTIONIST":
      return "/reception/dashboard";
    case "NURSE":
      return "/nurse/dashboard";
    case "DOCTOR":
      return "/doctor/dashboard";
    case "LAB_TECHNICIAN":
      return "/lab/dashboard";
    case "PATHOLOGIST":
      return "/pathologist/dashboard";
    case "PHARMACIST":
      return "/pharmacy/dashboard";
    case "BILLING_STAFF":
      return "/billing/dashboard";
    case "PATIENT":
    default:
      return "/patient/dashboard";
  }
}

// 6. Custom Authentication & Authorization Error
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

// 7. Check Single Permission for a given Role
export function hasPermission(role: string, permission: Permission): boolean {
  const normRole = normalizeRole(role);
  if (!normRole) return false;
  const allowedPermissions = ROLE_PERMISSIONS[normRole] || [];
  return allowedPermissions.includes(permission);
}

// 8. Check Any / All Permissions
export function hasAnyPermission(role: string, permissions: readonly Permission[]): boolean {
  return permissions.some((perm) => hasPermission(role, perm));
}

export function hasAllPermissions(role: string, permissions: readonly Permission[]): boolean {
  return permissions.every((perm) => hasPermission(role, perm));
}

// 9. Server Authorization Guard: Role Verification (401 if unauthenticated, 403 if unauthorized)
export async function requireRole(allowedRoles: AppRole | AppRole[], req?: any): Promise<SafeUser> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }

  const userRole = normalizeRole(user.role);
  if (!userRole) {
    throw new AuthError("Forbidden: Unrecognized system role", 403);
  }

  const roleList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roleList.includes(userRole)) {
    throw new AuthError(`Forbidden: Access restricted to authorized roles`, 403);
  }

  return user;
}

// 10. Server Authorization Guard: Permission Verification (401 if unauthenticated, 403 if unauthorized)
export async function requirePermission(permission: Permission | readonly Permission[], req?: any): Promise<SafeUser> {
  const user = await getCurrentUser(req);
  if (!user) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }

  const perms = Array.isArray(permission) ? permission : [permission];
  const userRole = normalizeRole(user.role);

  if (!userRole || !perms.every((p) => hasPermission(userRole, p))) {
    throw new AuthError(`Forbidden: Insufficient permissions for requested action`, 403);
  }

  return user;
}

// 11. Resource Ownership Guard for Patient-Scoped Data
export function assertPatientOwnership(
  sessionUser: SafeUser,
  targetPatientId: string | Types.ObjectId
): void {
  const role = normalizeRole(sessionUser.role);

  // Clinical staff with patient.view permission are authorized to view clinical patient records
  if (role && role !== "PATIENT") {
    if (!hasPermission(role, "patient.view")) {
      throw new AuthError("Forbidden: Insufficient clinical privileges to view patient records", 403);
    }
    return;
  }

  // Patients are strictly bound to their own profileId
  if (!sessionUser.profileId) {
    throw new AuthError("Forbidden: Patient profile not associated with this account", 403);
  }

  const sessionProfileIdStr = sessionUser.profileId.toString();
  const targetIdStr = targetPatientId.toString();

  if (sessionProfileIdStr !== targetIdStr) {
    throw new AuthError("Forbidden: You are not authorized to access another patient's data", 403);
  }
}

// 12. Standard API Error Response Handler
export function handleAuthError(error: unknown, fallbackMessage = "Internal server error"): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : fallbackMessage;

  if (
    message.includes("UNAUTHORIZED") ||
    message.includes("Authentication required") ||
    message === "UNAUTHENTICATED"
  ) {
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }

  if (
    message.includes("Forbidden") ||
    message.includes("FORBIDDEN") ||
    message.includes("Permission Denied")
  ) {
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }

  console.error("CareSync API execution error:", error);
  return NextResponse.json({ success: false, error: message || fallbackMessage }, { status: 500 });
}
