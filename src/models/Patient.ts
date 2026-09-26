import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPatient extends Document {
  userId: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  mrn: string; // Medical Record Number
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  insurance?: {
    provider?: string;
    policyNumber?: string;
    groupNumber?: string;
    expiryDate?: string;
  };
  allergies?: string[];
  primaryDoctorId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    mrn: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "O+",
    },
    phone: { type: String, trim: true },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
    },
    emergencyContact: {
      name: { type: String, default: "" },
      relationship: { type: String, default: "" },
      phone: { type: String, default: "" },
    },
    insurance: {
      provider: { type: String, default: "" },
      policyNumber: { type: String, default: "" },
      groupNumber: { type: String, default: "" },
      expiryDate: { type: String, default: "" },
    },
    allergies: { type: [String], default: [] },
    primaryDoctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
  },
  {
    timestamps: true,
  }
);

export const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);
