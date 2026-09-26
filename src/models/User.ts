import mongoose, { Schema, Document, Model } from "mongoose";
import { ROLES, Role } from "@/lib/constants";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string;
  avatar?: string;
  status: "active" | "inactive";
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
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: Object.values(ROLES),
      default: ROLES.PATIENT,
      index: true,
    },
    phone: { type: String, trim: true },
    avatar: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
