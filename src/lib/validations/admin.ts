import { z } from "zod";
import { normalizeRole, AppRole } from "@/lib/permissions";

export const ALLOWED_STAFF_ROLES: AppRole[] = [
  "RECEPTIONIST",
  "NURSE",
  "LAB_TECHNICIAN",
  "PATHOLOGIST",
  "PHARMACIST",
  "BILLING_STAFF",
];

export const CreateStaffSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  email: z.string().trim().email("Invalid email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").optional().default("CareSync2026!"),
  phone: z.string().trim().optional().default(""),
  role: z.string().trim().refine((val) => {
    const norm = normalizeRole(val);
    return norm !== null && ALLOWED_STAFF_ROLES.includes(norm);
  }, {
    message: "Invalid staff role. Allowed roles: RECEPTIONIST, NURSE, LAB_TECHNICIAN, PATHOLOGIST, PHARMACIST, BILLING_STAFF",
  }),
  department: z.string().trim().min(2, "Department is required"),
  departmentId: z.string().optional(),
  designation: z.string().trim().optional(),
  shift: z.string().trim().optional().default("Morning (08:00 - 16:00)"),
  emergencyContact: z.string().trim().optional().default(""),
  qualifications: z.string().trim().optional().default(""),
  notes: z.string().trim().optional().default(""),
});

export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;

export const UpdateStaffSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phone: z.string().trim().optional(),
  department: z.string().trim().min(2).optional(),
  departmentId: z.string().optional(),
  designation: z.string().trim().optional(),
  shift: z.string().trim().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "active", "inactive", "on_leave"]).optional(),
  emergencyContact: z.string().trim().optional(),
  qualifications: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;

export const CreateDoctorSchema = z.object({
  name: z.string().trim().min(2, "Doctor name must be at least 2 characters"),
  email: z.string().trim().email("Invalid doctor email address").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").optional().default("Doctor123!"),
  specialty: z.string().trim().min(2, "Specialty is required"),
  department: z.string().trim().min(2, "Department is required"),
  departmentId: z.string().optional(),
  licenseNumber: z.string().trim().optional(),
  qualification: z.string().trim().optional().default("MD, MBBS"),
  roomNumber: z.string().trim().optional().default("Consultation Room 101"),
  phone: z.string().trim().optional(),
  consultationFee: z.number().min(0).optional().default(500),
  availableDays: z.array(z.string()).optional().default(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
  workingHours: z.object({
    start: z.string().default("09:00 AM"),
    end: z.string().default("05:00 PM"),
  }).optional().default({ start: "09:00 AM", end: "05:00 PM" }),
  slotDurationMinutes: z.number().min(10).max(180).optional().default(30),
});

export type CreateDoctorInput = z.infer<typeof CreateDoctorSchema>;

export const UpdateDoctorSchema = z.object({
  name: z.string().trim().min(2).optional(),
  specialty: z.string().trim().min(2).optional(),
  specialization: z.string().trim().min(2).optional(),
  department: z.string().trim().min(2).optional(),
  departmentId: z.string().optional(),
  licenseNumber: z.string().trim().optional(),
  qualification: z.string().trim().optional(),
  roomNumber: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  consultationFee: z.number().min(0).optional(),
  availableDays: z.array(z.string()).optional(),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
  slotDurationMinutes: z.number().min(10).max(180).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "active", "inactive", "on_leave"]).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export type UpdateDoctorInput = z.infer<typeof UpdateDoctorSchema>;
