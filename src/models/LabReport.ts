import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILabResultItem {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "normal" | "high" | "low" | "critical";
}

export interface ILabReport extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  testName: string;
  department: string;
  sampleCollectionDate: Date;
  verifiedDate?: Date;
  status: "verified" | "finalized" | "pending" | "in-progress";
  summary: string;
  verifiedBy?: string;
  results: ILabResultItem[];
  fileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabResultItemSchema = new Schema<ILabResultItem>(
  {
    parameter: { type: String, required: true },
    value: { type: String, required: true },
    unit: { type: String, required: true },
    referenceRange: { type: String, required: true },
    flag: {
      type: String,
      enum: ["normal", "high", "low", "critical"],
      default: "normal",
    },
  },
  { _id: false }
);

const LabReportSchema = new Schema<ILabReport>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    testName: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    sampleCollectionDate: { type: Date, required: true },
    verifiedDate: { type: Date },
    status: {
      type: String,
      enum: ["verified", "finalized", "pending", "in-progress"],
      default: "verified",
      index: true,
    },
    summary: { type: String, required: true },
    verifiedBy: { type: String, default: "Dr. Sunita Patil, MD Pathology" },
    results: { type: [LabResultItemSchema], default: [] },
    fileUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

export const LabReport: Model<ILabReport> =
  mongoose.models.LabReport ||
  mongoose.model<ILabReport>("LabReport", LabReportSchema);
