import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Doctor, IDoctor } from "@/models/Doctor";
import { User, IUser } from "@/models/User";
import { Session } from "@/models/Session";
import { hashPassword } from "@/services/auth.service";
import {
  CreateDoctorSchema,
  UpdateDoctorSchema,
  CreateDoctorInput,
  UpdateDoctorInput,
} from "@/lib/validations/admin";
import { ServiceError } from "./service.error";
import { logAuditEvent } from "@/lib/audit";

export interface ListDoctorsFilters {
  search?: string;
  department?: string;
  specialty?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class DoctorService {
  /**
   * Generates a collision-safe, sequential Doctor ID (format: DOC-YYYY-XXX).
   */
  private static async generateDoctorId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `DOC-${currentYear}-`;

    const latestDoctor = await Doctor.findOne({
      doctorId: { $regex: `^${prefix}\\d+` },
    })
      .sort({ doctorId: -1 })
      .select("doctorId")
      .lean();

    let nextSeq = 1;
    if (latestDoctor?.doctorId) {
      const parts = latestDoctor.doctorId.split("-");
      const num = parseInt(parts[2], 10);
      if (!isNaN(num)) {
        nextSeq = num + 1;
      }
    }

    let candidateId = `${prefix}${String(nextSeq).padStart(3, "0")}`;
    while (await Doctor.exists({ doctorId: candidateId })) {
      nextSeq++;
      candidateId = `${prefix}${String(nextSeq).padStart(3, "0")}`;
    }
    return candidateId;
  }

  /**
   * Generates a collision-safe, default Medical License Number if none is provided.
   */
  private static async generateLicenseNumber(doctorId: string): Promise<string> {
    const base = `LIC-${doctorId}`;
    let candidate = base;
    let counter = 1;
    while (await Doctor.exists({ licenseNumber: candidate })) {
      candidate = `${base}-${counter}`;
      counter++;
    }
    return candidate;
  }

  /**
   * Retrieve list of doctors with server-side filtering, sorting, and pagination.
   */
  static async listDoctors(filters: ListDoctorsFilters = {}) {
    await connectToDatabase();

    const query: Record<string, unknown> = {};

    if (filters.department && filters.department !== "all") {
      query.department = filters.department;
    }

    if (filters.specialty && filters.specialty !== "all") {
      query.$or = [
        { specialty: filters.specialty },
        { specialization: filters.specialty },
      ];
    }

    if (filters.status && filters.status !== "all") {
      const s = filters.status.toLowerCase();
      query.status = { $in: [s, s.toUpperCase()] };
    }

    if (filters.search) {
      const term = filters.search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { specialty: { $regex: term, $options: "i" } },
        { department: { $regex: term, $options: "i" } },
        { doctorId: { $regex: term, $options: "i" } },
        { licenseNumber: { $regex: term, $options: "i" } },
        { roomNumber: { $regex: term, $options: "i" } },
      ];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
    const skip = (page - 1) * limit;

    const [doctorList, total] = await Promise.all([
      Doctor.find(query)
        .populate("userId", "name email role status")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Doctor.countDocuments(query),
    ]);

    return {
      doctors: doctorList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Fetch single doctor record by MongoDB ObjectId or doctorId.
   */
  static async getDoctorById(id: string) {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { doctorId: id }] }
      : { doctorId: id };

    const doctor = await Doctor.findOne(query)
      .populate("userId", "name email role status")
      .lean();

    if (!doctor) {
      throw new ServiceError("Doctor profile not found", 404);
    }

    return doctor;
  }

  /**
   * Creates a new doctor profile and provisions a linked user identity with role DOCTOR.
   * Enforces email uniqueness, license uniqueness, scrypt password hashing, and explicit rollback on failure.
   */
  static async createDoctor(rawInput: unknown, actorUser?: { id?: string; name?: string; email?: string; role?: string }) {
    await connectToDatabase();

    // 1. Validate inputs via Zod schema
    const parseResult = CreateDoctorSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const message = parseResult.error.issues.map((e) => e.message).join(", ");
      throw new ServiceError(message, 400);
    }
    const input: CreateDoctorInput = parseResult.data;

    // 2. Email Uniqueness Verification across User and Doctor collections
    const normalizedEmail = input.email.toLowerCase().trim();
    const [existingUser, existingDoctorEmail] = await Promise.all([
      User.findOne({ email: normalizedEmail }).lean(),
      Doctor.findOne({ email: normalizedEmail }).lean(),
    ]);

    if (existingUser || existingDoctorEmail) {
      throw new ServiceError("A user or physician profile with this email already exists.", 409);
    }

    // 3. License Number Uniqueness Verification if provided
    let licenseNumber = input.licenseNumber?.trim();
    if (licenseNumber) {
      const existingLicense = await Doctor.findOne({ licenseNumber }).lean();
      if (existingLicense) {
        throw new ServiceError(`A doctor with license number '${licenseNumber}' already exists.`, 409);
      }
    }

    // 4. Generate collision-safe Doctor ID and default license number if needed
    const doctorId = await this.generateDoctorId();
    if (!licenseNumber) {
      licenseNumber = await this.generateLicenseNumber(doctorId);
    }

    // 5. Atomic-style creation with explicit rollback protection
    let createdUser: IUser | null = null;
    let createdDoctor: IDoctor | null = null;

    try {
      // Step A: Create User Authentication Identity with role DOCTOR
      createdUser = await User.create({
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(input.password || "Doctor123!"),
        role: "DOCTOR",
        phone: input.phone || "",
        status: "ACTIVE",
      });

      // Step B: Create Doctor Profile Document
      createdDoctor = await Doctor.create({
        userId: createdUser._id,
        doctorId,
        name: input.name.trim(),
        specialty: input.specialty.trim(),
        specialization: input.specialty.trim(),
        department: input.department.trim(),
        departmentId: input.departmentId && mongoose.Types.ObjectId.isValid(input.departmentId) ? new Types.ObjectId(input.departmentId) : undefined,
        licenseNumber,
        qualification: input.qualification?.trim() || "MD, MBBS",
        roomNumber: input.roomNumber?.trim() || "Consultation Room 101",
        phone: input.phone?.trim() || "",
        email: normalizedEmail,
        consultationFee: input.consultationFee ?? 500,
        availableDays: input.availableDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        workingHours: input.workingHours || { start: "09:00 AM", end: "05:00 PM" },
        slotDurationMinutes: input.slotDurationMinutes || 30,
        status: "ACTIVE",
      });

      // Step C: Link bidirectional reference in User
      createdUser.profileId = createdDoctor._id;
      createdUser.profileType = "Doctor";
      await createdUser.save();

      // Step D: Log Audit Event
      await logAuditEvent({
        actor: {
          userId: mongoose.Types.ObjectId.isValid(actorUser?.id || "") ? new Types.ObjectId(actorUser?.id) : undefined,
          name: actorUser?.name,
          email: actorUser?.email,
          role: actorUser?.role,
        },
        action: "DOCTOR_CREATED",
        resource: `${input.name} (${doctorId})`,
        resourceType: "doctor",
        metadata: {
          doctorId,
          email: normalizedEmail,
          department: input.department,
          specialty: input.specialty,
          licenseNumber,
        },
      });

      // Return safe doctor object (without password / hash)
      const safeDoctor = createdDoctor.toObject();
      return safeDoctor;
    } catch (err: unknown) {
      console.error("DoctorService.createDoctor error:", err);
      // Explicit rollback: guarantee no orphaned User or Doctor account
      if (createdDoctor?._id) {
        await Doctor.deleteOne({ _id: createdDoctor._id }).catch(() => {});
      }
      if (createdUser?._id) {
        await User.deleteOne({ _id: createdUser._id }).catch(() => {});
      }

      // Handle duplicate key error cleanly
      if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
        throw new ServiceError("A record with this unique identifier, license, or email already exists.", 409);
      }

      if (err instanceof ServiceError) {
        throw err;
      }

      if ((err as any)?.name === "ValidationError") {
        throw new ServiceError((err as any).message || "Validation failed", 400);
      }

      if ((err as any)?.name === "CastError") {
        throw new ServiceError("Invalid data format provided", 400);
      }

      const errMsg = err instanceof Error ? err.message : "Failed to create doctor profile";
      throw new ServiceError(errMsg, 500);
    }
  }

  /**
   * Update permitted doctor profile information.
   * Disallows modifying authentication identity, doctorId, email, or system privileges.
   */
  static async updateDoctor(
    id: string,
    rawInput: unknown,
    actorUser?: { id?: string; name?: string; email?: string; role?: string }
  ) {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { doctorId: id }] }
      : { doctorId: id };

    const doctor = await Doctor.findOne(query);
    if (!doctor) {
      throw new ServiceError("Doctor profile not found", 404);
    }

    const parseResult = UpdateDoctorSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const message = parseResult.error.issues.map((e) => e.message).join(", ");
      throw new ServiceError(message, 400);
    }
    const input: UpdateDoctorInput = parseResult.data;

    // Check license uniqueness if licenseNumber is being updated
    if (input.licenseNumber && input.licenseNumber.trim() !== doctor.licenseNumber) {
      const duplicateLicense = await Doctor.findOne({
        licenseNumber: input.licenseNumber.trim(),
        _id: { $ne: doctor._id },
      }).lean();
      if (duplicateLicense) {
        throw new ServiceError(`A doctor with license number '${input.licenseNumber}' already exists.`, 409);
      }
      doctor.licenseNumber = input.licenseNumber.trim();
    }

    const previousStatus = doctor.status;
    const previousDepartment = doctor.department;

    if (input.name !== undefined) doctor.name = input.name.trim();
    if (input.specialty !== undefined) {
      doctor.specialty = input.specialty.trim();
      doctor.specialization = input.specialty.trim();
    }
    if (input.specialization !== undefined) {
      doctor.specialization = input.specialization.trim();
      doctor.specialty = input.specialization.trim();
    }
    if (input.department !== undefined) doctor.department = input.department.trim();
    if (input.departmentId !== undefined) {
      doctor.departmentId = input.departmentId && mongoose.Types.ObjectId.isValid(input.departmentId) ? new Types.ObjectId(input.departmentId) : undefined;
    }
    if (input.qualification !== undefined) doctor.qualification = input.qualification.trim();
    if (input.roomNumber !== undefined) doctor.roomNumber = input.roomNumber.trim();
    if (input.phone !== undefined) doctor.phone = input.phone.trim();
    if (input.consultationFee !== undefined) doctor.consultationFee = input.consultationFee;
    if (input.availableDays !== undefined) doctor.availableDays = input.availableDays;
    if (input.workingHours !== undefined) doctor.workingHours = input.workingHours;
    if (input.slotDurationMinutes !== undefined) doctor.slotDurationMinutes = input.slotDurationMinutes;

    if (input.status !== undefined) {
      doctor.status = input.status as IDoctor["status"];
    }

    await doctor.save();

    // Synchronize User name and status if linked
    if (doctor.userId) {
      const userUpdates: Record<string, unknown> = {};
      if (input.name) {
        userUpdates.name = input.name.trim();
      }
      if (input.status) {
        const normStatus = input.status.toUpperCase();
        userUpdates.status = normStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE";

        // Invalidate active sessions if deactivated
        if (normStatus !== "ACTIVE") {
          await Session.deleteMany({ userId: doctor.userId }).catch(() => {});
        }
      }
      if (input.password) {
        userUpdates.passwordHash = hashPassword(input.password);
        // Invalidate active sessions on password reset
        await Session.deleteMany({ userId: doctor.userId }).catch(() => {});
      }

      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(doctor.userId, userUpdates);
      }
    }

    // Log audit event
    await logAuditEvent({
      actor: {
        userId: mongoose.Types.ObjectId.isValid(actorUser?.id || "") ? new Types.ObjectId(actorUser?.id) : undefined,
        name: actorUser?.name,
        email: actorUser?.email,
        role: actorUser?.role,
      },
      action: input.password
        ? "DOCTOR_PASSWORD_RESET"
        : input.status && input.status !== previousStatus
        ? "DOCTOR_STATUS_CHANGED"
        : "DOCTOR_UPDATED",
      resource: `${doctor.name} (${doctor.doctorId})`,
      resourceType: "doctor",
      metadata: {
        previousStatus,
        newStatus: doctor.status,
        previousDepartment,
        newDepartment: doctor.department,
        passwordUpdated: !!input.password,
        updates: { ...input, password: input.password ? "[REDACTED]" : undefined },
      },
    });

    const updated = await Doctor.findById(doctor._id)
      .populate("userId", "name email role status")
      .lean();

    return updated;
  }

  /**
   * Activate doctor account and linked user authentication status.
   */
  static async activateDoctor(id: string, actorUser?: { id?: string; name?: string; email?: string; role?: string }) {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { doctorId: id }] }
      : { doctorId: id };

    const doctor = await Doctor.findOne(query);
    if (!doctor) {
      throw new ServiceError("Doctor profile not found", 404);
    }

    doctor.status = "ACTIVE";
    await doctor.save();

    if (doctor.userId) {
      await User.findByIdAndUpdate(doctor.userId, { status: "ACTIVE" });
    }

    await logAuditEvent({
      actor: {
        userId: mongoose.Types.ObjectId.isValid(actorUser?.id || "") ? new Types.ObjectId(actorUser?.id) : undefined,
        name: actorUser?.name,
        email: actorUser?.email,
        role: actorUser?.role,
      },
      action: "DOCTOR_ACTIVATED",
      resource: `${doctor.name} (${doctor.doctorId})`,
      resourceType: "doctor",
      metadata: { doctorId: doctor.doctorId },
    });

    return Doctor.findById(doctor._id).populate("userId", "name email role status").lean();
  }

  /**
   * Deactivate doctor account, revoke active sessions, and synchronize linked user status.
   */
  static async deactivateDoctor(id: string, actorUser?: { id?: string; name?: string; email?: string; role?: string }) {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { doctorId: id }] }
      : { doctorId: id };

    const doctor = await Doctor.findOne(query);
    if (!doctor) {
      throw new ServiceError("Doctor profile not found", 404);
    }

    doctor.status = "INACTIVE";
    await doctor.save();

    if (doctor.userId) {
      await User.findByIdAndUpdate(doctor.userId, { status: "INACTIVE" });
      await Session.deleteMany({ userId: doctor.userId }).catch(() => {});
    }

    await logAuditEvent({
      actor: {
        userId: mongoose.Types.ObjectId.isValid(actorUser?.id || "") ? new Types.ObjectId(actorUser?.id) : undefined,
        name: actorUser?.name,
        email: actorUser?.email,
        role: actorUser?.role,
      },
      action: "DOCTOR_DEACTIVATED",
      resource: `${doctor.name} (${doctor.doctorId})`,
      resourceType: "doctor",
      metadata: { doctorId: doctor.doctorId },
    });

    return Doctor.findById(doctor._id).populate("userId", "name email role status").lean();
  }
}
