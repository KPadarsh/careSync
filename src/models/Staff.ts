import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStaff extends Document {
  employeeId: string;
  userId?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  role:
    | "receptionist"
    | "nurse"
    | "lab_technician"
    | "pathologist"
    | "pharmacist"
    | "billing_staff"
    | "administrator"
    | "other";
  department: string;
  designation: string;
  shift: string;
  status: "active" | "inactive" | "on_leave";
  joinedDate: Date;
  emergencyContact?: string;
  qualifications?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: [
        "receptionist",
        "nurse",
        "lab_technician",
        "pathologist",
        "pharmacist",
        "billing_staff",
        "administrator",
        "other",
      ],
      index: true,
    },
    department: { type: String, required: true, trim: true, index: true },
    designation: { type: String, required: true, trim: true },
    shift: { type: String, default: "Morning (08:00 - 16:00)" },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active",
      index: true,
    },
    joinedDate: { type: Date, default: Date.now },
    emergencyContact: { type: String, default: "" },
    qualifications: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const Staff: Model<IStaff> =
  mongoose.models.Staff || mongoose.model<IStaff>("Staff", StaffSchema);
