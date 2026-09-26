import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILabResultItem {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "normal" | "high" | "low" | "critical";
}

export type LabRequestStatus =
  | "requested"
  | "sample-pending"
  | "sample-collected"
  | "processing"
  | "result-entered"
  | "submitted-for-review"
  | "verified"
  | "finalized"
  | "pending"
  | "in-progress";

export interface ILabReport extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  sampleId?: Types.ObjectId; // Reference to LabSample
  sampleCode?: string; // e.g. SMP-2026-00125
  testName: string;
  department: string;
  priority: "routine" | "urgent" | "stat";
  clinicalReason?: string;
  instructions?: string;
  sampleCollectionDate: Date;
  verifiedDate?: Date;
  submittedAt?: Date;
  submittedBy?: string; // Technician Name
  status: LabRequestStatus;
  summary: string;
  technicianNotes?: string;
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
    sampleId: {
      type: Schema.Types.ObjectId,
      ref: "LabSample",
      index: true,
    },
    sampleCode: { type: String, trim: true },
    testName: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true, default: "Diagnostic Pathology" },
    priority: {
      type: String,
      enum: ["routine", "urgent", "stat"],
      default: "routine",
      index: true,
    },
    clinicalReason: { type: String, default: "" },
    instructions: { type: String, default: "" },
    sampleCollectionDate: { type: Date, default: Date.now },
    verifiedDate: { type: Date },
    submittedAt: { type: Date },
    submittedBy: { type: String },
    status: {
      type: String,
      enum: [
        "requested",
        "sample-pending",
        "sample-collected",
        "processing",
        "result-entered",
        "submitted-for-review",
        "verified",
        "finalized",
        "pending",
        "in-progress",
      ],
      default: "sample-pending",
      index: true,
    },
    summary: { type: String, default: "" },
    technicianNotes: { type: String, default: "" },
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
