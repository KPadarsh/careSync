import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPatientAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface IPatientEmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
}

export interface IPatientInsurance {
  provider?: string;
  policyNumber?: string;
  groupNumber?: string;
  expiryDate?: string;
}

export interface IPatient extends Document {
  userId?: Types.ObjectId;
  patientId: string;
  mrn?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other" | "MALE" | "FEMALE" | "OTHER";
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  phone: string;
  email?: string;
  address?: IPatientAddress;
  allergies?: string[];
  emergencyContact?: IPatientEmergencyContact;
  insurance?: IPatientInsurance;
  primaryDoctorId?: Types.ObjectId;
  status: "ACTIVE" | "INACTIVE" | "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
      sparse: true,
      index: true,
    },
    patientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
      default: function (this: IPatient) {
        return this.mrn || `PAT-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    mrn: {
      type: String,
      index: true,
      uppercase: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: "Patient",
    },
    lastName: {
      type: String,
      trim: true,
      default: "Record",
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "MALE", "FEMALE", "OTHER"],
      default: "male",
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: "O+",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
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
    allergies: {
      type: [String],
      default: [],
    },
    primaryDoctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
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

// Keep mrn in sync with patientId
PatientSchema.pre<IPatient>("save", function () {
  if (!this.mrn && this.patientId) {
    this.mrn = this.patientId;
  }
  if (!this.patientId && this.mrn) {
    this.patientId = this.mrn;
  }
});

export const Patient: Model<IPatient> =
  mongoose.models.Patient || mongoose.model<IPatient>("Patient", PatientSchema);
