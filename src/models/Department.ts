import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  code?: string;
  description?: string;
  headOfDepartment?: string;
  headDoctorId?: mongoose.Types.ObjectId;
  location?: string;
  phone?: string;
  email?: string;
  operatingHours?: {
    start: string;
    end: string;
  };
  status: "ACTIVE" | "INACTIVE" | "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    headOfDepartment: {
      type: String,
      default: "",
      trim: true,
    },
    headDoctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
    },
    location: {
      type: String,
      default: "Main Clinic Building",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    operatingHours: {
      start: { type: String, default: "08:00 AM" },
      end: { type: String, default: "08:00 PM" },
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "active", "inactive"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Department: Model<IDepartment> =
  mongoose.models.Department ||
  mongoose.model<IDepartment>("Department", DepartmentSchema);
