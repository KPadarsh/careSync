import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: string;
  headDoctorId?: mongoose.Types.ObjectId;
  location: string;
  phone?: string;
  email?: string;
  operatingHours: {
    start: string;
    end: string;
  };
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    headOfDepartment: { type: String, default: "" },
    headDoctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
    location: { type: String, required: true, default: "Main Clinic Building" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    operatingHours: {
      start: { type: String, default: "08:00 AM" },
      end: { type: String, default: "08:00 PM" },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Department: Model<IDepartment> =
  mongoose.models.Department || mongoose.model<IDepartment>("Department", DepartmentSchema);
