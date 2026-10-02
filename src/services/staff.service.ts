import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Staff, IStaff } from "@/models/Staff";
import { Department } from "@/models/Department";
import { User, IUser } from "@/models/User";
import { Session } from "@/models/Session";
import { hashPassword } from "@/services/auth.service";
import { normalizeRole, AppRole } from "@/lib/permissions";
import {
  CreateStaffSchema,
  UpdateStaffSchema,
  ALLOWED_STAFF_ROLES,
  CreateStaffInput,
  UpdateStaffInput,
} from "@/lib/validations/admin";
import { ServiceError } from "./service.error";
import { logAuditEvent } from "@/lib/audit";

export interface ListStaffFilters {
  search?: string;
  role?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class StaffService {
  /**
   * Generates a collision-safe, sequential Employee ID (format: STF-YYYY-XXX).
   */
  private static async generateEmployeeId(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `STF-${currentYear}-`;

    const latestStaff = await Staff.findOne({
      employeeId: { $regex: `^${prefix}\\d+` },
    })
      .sort({ employeeId: -1 })
      .select("employeeId")
      .lean();

    let nextSeq = 1;
    if (latestStaff?.employeeId) {
      const parts = latestStaff.employeeId.split("-");
      const num = parseInt(parts[2], 10);
      if (!isNaN(num)) {
        nextSeq = num + 1;
      }
    }

    let candidateId = `${prefix}${String(nextSeq).padStart(3, "0")}`;
    while (await Staff.exists({ employeeId: candidateId })) {
      nextSeq++;
      candidateId = `${prefix}${String(nextSeq).padStart(3, "0")}`;
    }
    return candidateId;
  }

  /**
   * Retrieve list of staff records with server-side filtering, sorting, and pagination.
   */
  static async listStaff(filters: ListStaffFilters = {}) {
    await connectToDatabase();

    const query: Record<string, unknown> = {};

    if (filters.role && filters.role !== "all") {
      const normRole = normalizeRole(filters.role);
      if (normRole) {
        query.$or = [
          { role: filters.role.toLowerCase() },
          { role: normRole },
          { role: filters.role },
        ];
      } else {
        query.role = filters.role;
      }
    }

    if (filters.department && filters.department !== "all") {
      query.department = filters.department;
    }

    if (filters.status && filters.status !== "all") {
      const s = filters.status.toLowerCase();
      query.status = { $in: [s, s.toUpperCase()] };
    }

    if (filters.search) {
      const term = filters.search.trim();
      query.$or = [
        { fullName: { $regex: term, $options: "i" } },
        { email: { $regex: term, $options: "i" } },
        { employeeId: { $regex: term, $options: "i" } },
        { designation: { $regex: term, $options: "i" } },
        { department: { $regex: term, $options: "i" } },
      ];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filters.limit) || 50));
    const skip = (page - 1) * limit;

    const [staffList, total] = await Promise.all([
      Staff.find(query)
        .populate("userId", "name email role status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Staff.countDocuments(query),
    ]);

    return {
      staff: staffList,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Fetch single staff record by MongoDB ObjectId or employeeId.
   */
  static async getStaffById(id: string) {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { employeeId: id }] }
      : { employeeId: id };

    const staff = await Staff.findOne(query)
      .populate("userId", "name email role status")
      .lean();

    if (!staff) {
      throw new ServiceError("Staff member not found", 404);
    }

    return staff;
  }

  /**
   * Creates a new staff member and provisions a linked user identity.
   * Enforces strict role restrictions, scrypt password hashing, and explicit rollback on failure.
   */
  static async createStaff(rawInput: unknown, actorUser?: { id?: string; name?: string; email?: string; role?: string }) {
    await connectToDatabase();

    // 1. Validate inputs via Zod schema
    const parseResult = CreateStaffSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const fieldErrors: Record<string, string> = {};
      parseResult.error.issues.forEach((issue) => {
        const field = issue.path.join(".");
        if (field) fieldErrors[field] = issue.message;
      });
      const message = parseResult.error.issues.map((e) => e.message).join(", ");
      const err = new ServiceError(message, 400);
      (err as any).fieldErrors = fieldErrors;
      throw err;
    }
    const input: CreateStaffInput = parseResult.data;

    // 2. Strict Role Restriction: Only allowed non-admin staff roles
    const normRole = normalizeRole(input.role);
    if (!normRole || !ALLOWED_STAFF_ROLES.includes(normRole)) {
      throw new ServiceError(
        `Invalid staff role '${input.role}'. Allowed staff roles: ${ALLOWED_STAFF_ROLES.join(", ")}`,
        400
      );
    }

    // 3. Email Uniqueness Verification across User and Staff collections
    const normalizedEmail = input.email.toLowerCase().trim();
    const [existingUser, existingStaff] = await Promise.all([
      User.findOne({ email: normalizedEmail }).lean(),
      Staff.findOne({ email: normalizedEmail }).lean(),
    ]);

    if (existingUser || existingStaff) {
      throw new ServiceError("A user or staff profile with this email already exists.", 409);
    }

    // 4. Resolve real Department relationship from departmentId or department name
    let resolvedDeptId: Types.ObjectId | undefined;
    if (input.departmentId && mongoose.Types.ObjectId.isValid(input.departmentId)) {
      resolvedDeptId = new Types.ObjectId(input.departmentId);
    } else if (input.department) {
      const deptDoc = await Department.findOne({
        name: { $regex: new RegExp(`^${input.department.trim()}$`, "i") },
      })
        .select("_id")
        .lean();
      if (deptDoc?._id) {
        resolvedDeptId = deptDoc._id as Types.ObjectId;
      }
    }

    // 5. Generate collision-safe Staff ID
    const employeeId = await this.generateEmployeeId();

    // 6. Atomic-style creation with explicit rollback protection
    let createdUser: IUser | null = null;
    let createdStaff: IStaff | null = null;

    try {
      // Step A: Create User Authentication Identity
      createdUser = await User.create({
        name: input.fullName.trim(),
        email: normalizedEmail,
        passwordHash: hashPassword(input.password || "CareSync2026!"),
        role: normRole,
        phone: input.phone || "",
        status: "ACTIVE",
      });

      // Step B: Create Staff Profile Document
      createdStaff = await Staff.create({
        userId: createdUser._id,
        employeeId,
        fullName: input.fullName.trim(),
        email: normalizedEmail,
        phone: input.phone?.trim() || "",
        role: normRole.toLowerCase(),
        department: input.department.trim(),
        departmentId: resolvedDeptId,
        designation: input.designation?.trim() || normRole.replace("_", " "),
        shift: input.shift || "Morning (08:00 - 16:00)",
        status: "ACTIVE",
        joinedDate: new Date(),
        emergencyContact: input.emergencyContact || "",
        qualifications: input.qualifications || "",
        notes: input.notes || "",
      });

      // Step C: Link bidirectional reference in User
      createdUser.profileId = createdStaff._id;
      createdUser.profileType = "Staff";
      await createdUser.save();

      // Step D: Log Audit Event
      await logAuditEvent({
        actor: {
          userId: mongoose.Types.ObjectId.isValid(actorUser?.id || "") ? new Types.ObjectId(actorUser?.id) : undefined,
          name: actorUser?.name,
          email: actorUser?.email,
          role: actorUser?.role,
        },
        action: "STAFF_CREATED",
        resource: `${input.fullName} (${employeeId})`,
        resourceType: "staff",
        metadata: {
          employeeId,
          email: normalizedEmail,
          role: normRole,
          department: input.department,
        },
      });

      // Return safe staff object (without password / hash)
      const safeStaff = createdStaff.toObject();
      return safeStaff;
    } catch (err: unknown) {
      console.error("StaffService.createStaff error:", err);
      // Explicit rollback: guarantee no orphaned User or Staff account
      if (createdStaff?._id) {
        await Staff.deleteOne({ _id: createdStaff._id }).catch(() => {});
      }
      if (createdUser?._id) {
        await User.deleteOne({ _id: createdUser._id }).catch(() => {});
      }

      // Handle duplicate key error from Mongo unique indexes cleanly
      if (typeof err === "object" && err !== null && "code" in err && (err as { code: number }).code === 11000) {
        throw new ServiceError("A record with this unique identifier or email already exists.", 409);
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

      const errMsg = err instanceof Error ? err.message : "Failed to create staff member";
      throw new ServiceError(errMsg, 500);
    }
  }

  /**
   * Update permitted staff profile information.
   * Disallows modifying authentication identity, employeeId, email, or role elevation.
   */
  static async updateStaff(
    id: string,
    rawInput: unknown,
    actorUser?: { id?: string; name?: string; email?: string; role?: string }
  ) {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { employeeId: id }] }
      : { employeeId: id };

    const staff = await Staff.findOne(query);
    if (!staff) {
      throw new ServiceError("Staff member not found", 404);
    }

    const parseResult = UpdateStaffSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const message = parseResult.error.issues.map((e) => e.message).join(", ");
      throw new ServiceError(message, 400);
    }
    const input: UpdateStaffInput = parseResult.data;

    const previousStatus = staff.status;
    const previousDepartment = staff.department;

    if (input.fullName !== undefined) staff.fullName = input.fullName.trim();
    if (input.phone !== undefined) staff.phone = input.phone.trim();
    if (input.department !== undefined) staff.department = input.department.trim();
    if (input.departmentId !== undefined) {
      staff.departmentId = input.departmentId && mongoose.Types.ObjectId.isValid(input.departmentId) ? new Types.ObjectId(input.departmentId) : undefined;
    }
    if (input.designation !== undefined) staff.designation = input.designation.trim();
    if (input.shift !== undefined) staff.shift = input.shift;
    if (input.emergencyContact !== undefined) staff.emergencyContact = input.emergencyContact.trim();
    if (input.qualifications !== undefined) staff.qualifications = input.qualifications.trim();
    if (input.notes !== undefined) staff.notes = input.notes.trim();

    if (input.status !== undefined) {
      staff.status = input.status as IStaff["status"];
    }

    await staff.save();

    // Synchronize User name and status if linked
    if (staff.userId) {
      const userUpdates: Record<string, unknown> = {};
      if (input.fullName) {
        userUpdates.name = input.fullName.trim();
      }
      if (input.status) {
        const normStatus = input.status.toUpperCase();
        userUpdates.status = normStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE";

        // Invalidate active sessions if deactivated
        if (normStatus !== "ACTIVE") {
          await Session.deleteMany({ userId: staff.userId }).catch(() => {});
        }
      }
      if (input.password) {
        userUpdates.passwordHash = hashPassword(input.password);
        // Invalidate active sessions on password reset
        await Session.deleteMany({ userId: staff.userId }).catch(() => {});
      }

      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(staff.userId, userUpdates);
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
        ? "STAFF_PASSWORD_RESET"
        : input.status && input.status !== previousStatus
        ? "STAFF_STATUS_CHANGED"
        : "STAFF_UPDATED",
      resource: `${staff.fullName} (${staff.employeeId})`,
      resourceType: "staff",
      metadata: {
        previousStatus,
        newStatus: staff.status,
        previousDepartment,
        newDepartment: staff.department,
        passwordUpdated: !!input.password,
        updates: { ...input, password: input.password ? "[REDACTED]" : undefined },
      },
    });

    const updated = await Staff.findById(staff._id)
      .populate("userId", "name email role status")
      .lean();

    return updated;
  }

  /**
   * Activate staff account and linked user authentication status.
   */
  static async activateStaff(id: string, actorUser?: { id?: string; name?: string; email?: string; role?: string }) {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { employeeId: id }] }
      : { employeeId: id };

    const staff = await Staff.findOne(query);
    if (!staff) {
      throw new ServiceError("Staff member not found", 404);
    }

    staff.status = "ACTIVE";
    await staff.save();

    if (staff.userId) {
      await User.findByIdAndUpdate(staff.userId, { status: "ACTIVE" });
    }

    await logAuditEvent({
      actor: {
        userId: mongoose.Types.ObjectId.isValid(actorUser?.id || "") ? new Types.ObjectId(actorUser?.id) : undefined,
        name: actorUser?.name,
        email: actorUser?.email,
        role: actorUser?.role,
      },
      action: "STAFF_ACTIVATED",
      resource: `${staff.fullName} (${staff.employeeId})`,
      resourceType: "staff",
      metadata: { employeeId: staff.employeeId },
    });

    return Staff.findById(staff._id).populate("userId", "name email role status").lean();
  }

  /**
   * Deactivate staff account, revoke active sessions, and synchronize linked user status.
   */
  static async deactivateStaff(id: string, actorUser?: { id?: string; name?: string; email?: string; role?: string }) {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { employeeId: id }] }
      : { employeeId: id };

    const staff = await Staff.findOne(query);
    if (!staff) {
      throw new ServiceError("Staff member not found", 404);
    }

    staff.status = "INACTIVE";
    await staff.save();

    if (staff.userId) {
      await User.findByIdAndUpdate(staff.userId, { status: "INACTIVE" });
      await Session.deleteMany({ userId: staff.userId }).catch(() => {});
    }

    await logAuditEvent({
      actor: {
        userId: mongoose.Types.ObjectId.isValid(actorUser?.id || "") ? new Types.ObjectId(actorUser?.id) : undefined,
        name: actorUser?.name,
        email: actorUser?.email,
        role: actorUser?.role,
      },
      action: "STAFF_DEACTIVATED",
      resource: `${staff.fullName} (${staff.employeeId})`,
      resourceType: "staff",
      metadata: { employeeId: staff.employeeId },
    });

    return Staff.findById(staff._id).populate("userId", "name email role status").lean();
  }

  /**
   * Permanently deletes a staff member and linked user account from database.
   * Revokes active sessions and logs audit event.
   */
  static async deleteStaff(id: string, actorUser?: { id?: string; name?: string; email?: string; role?: string }) {
    await connectToDatabase();

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId
      ? { $or: [{ _id: id }, { employeeId: id }] }
      : { employeeId: id };

    const staff = await Staff.findOne(query);
    if (!staff) {
      throw new ServiceError("Staff member not found", 404);
    }

    const staffId = staff._id;
    const userId = staff.userId;
    const employeeId = staff.employeeId;
    const staffName = staff.fullName;

    // 1. Delete Staff document from MongoDB
    await Staff.findByIdAndDelete(staffId);

    // 2. If linked user exists, revoke active sessions and delete User
    if (userId) {
      await Session.deleteMany({ userId }).catch(() => {});
      await User.findByIdAndDelete(userId).catch(() => {});
    }

    // 3. Log Audit Event
    await logAuditEvent({
      actor: {
        userId: mongoose.Types.ObjectId.isValid(actorUser?.id || "") ? new Types.ObjectId(actorUser?.id) : undefined,
        name: actorUser?.name,
        email: actorUser?.email,
        role: actorUser?.role,
      },
      action: "STAFF_DELETED",
      resource: `${staffName} (${employeeId})`,
      resourceType: "staff",
      metadata: { employeeId, staffId: staffId.toString(), userId: userId?.toString() },
    });

    return {
      success: true,
      message: `Staff member ${staffName} (${employeeId}) deleted successfully`,
    };
  }
}
