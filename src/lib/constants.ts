/**
 * CareSync Application Constants
 */

export const APP_NAME = "CareSync";
export const APP_DESCRIPTION = "Modern Healthcare Management System";

/**
 * CareSync System Roles
 */
export const ROLES = {
  PATIENT: "patient",
  ADMIN: "admin",
  RECEPTION: "reception",
  NURSE: "nurse",
  DOCTOR: "doctor",
  LAB_TECHNICIAN: "lab_technician",
  PATHOLOGIST: "pathologist",
  PHARMACY: "pharmacy",
  BILLING: "billing",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
