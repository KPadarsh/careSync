import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { ROLES, Role } from "@/lib/constants";

export type UserRole =
  | "PATIENT"
  | "RECEPTIONIST"
  | "NURSE"
  | "DOCTOR"
  | "LAB_TECHNICIAN"
  | "PATHOLOGIST"
  | "PHARMACIST"
  | "BILLING_STAFF"
  | "ADMIN"
  | Role;

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED"
  | "active"
  | "inactive"
  | "suspended";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole; // Supports uppercase AppRoles and legacy Role values
  phone?: string;
  avatar?: string;
  status: "active" | "inactive" | "suspended" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
  profileType?: "Doctor" | "Staff" | "Patient" | string;
  profileId?: Types.ObjectId;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: [
        "PATIENT",
        "RECEPTIONIST",
        "NURSE",
        "DOCTOR",
        "LAB_TECHNICIAN",
        "PATHOLOGIST",
        "PHARMACIST",
        "BILLING_STAFF",
        "ADMIN",
        ...Object.values(ROLES),
        "receptionist",
        "pharmacist",
        "billing_staff",
      ],
      default: ROLES.PATIENT,
      index: true,
    },
    phone: { type: String, trim: true },
    avatar: { type: String },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "active", "inactive", "suspended"],
      default: "ACTIVE",
      index: true,
    },
    profileType: {
      type: String,
      trim: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      refPath: "profileType",
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete (ret as Record<string, unknown>).passwordHash;
        return ret;
      },
    },
  }
);

// Explicit compound index for performance
UserSchema.index({ role: 1, status: 1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
