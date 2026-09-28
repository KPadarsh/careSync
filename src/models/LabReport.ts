import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILabResultItem {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "normal" | "high" | "low" | "critical";
}

export type LabReportStatus =
  | "requested"
  | "sample_pending"
  | "sample_collected"
  | "processing"
  | "result_entered"
  | "submitted_for_review"
  | "under_review"
  | "correction_required"
  | "verified"
  | "finalized"
  | "pending" // backward compatibility
  | "in-progress"; // backward compatibility

export interface IReportRevision {
  revisionDate: Date;
  revisedBy: string;
  reason: string;
  previousSummary?: string;
  previousInterpretation?: string;
}

export interface ILabReport extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  testName: string;
  department: string;
  priority: "routine" | "urgent" | "stat";
  sampleId?: string; // e.g. SMP-2026-00125
  sampleDocId?: Types.ObjectId; // ref: LabSample
  sampleType?: string;
  tubeType?: string;
  barcode?: string;
  sampleCollectionDate: Date;
  sampleCollectedAt?: Date;
  sampleCollectedBy?: string;
  processingStartedAt?: Date;
  processingBy?: string;
  analyzerBench?: string;
  resultEnteredAt?: Date;
  submittedForReviewAt?: Date;
  submittedBy?: string;
  underReviewAt?: Date;
  underReviewBy?: string;
  correctionRequestedAt?: Date;
  correctionReason?: string;
  verifiedDate?: Date;
  verifiedAt?: Date;
  status: LabReportStatus;
  summary: string;
  technicianNotes?: string;
  verifiedBy?: string;
  pathologistNotes?: string;
  pathologistInterpretation?: string;
  pathologistComments?: string;
  revisionHistory?: IReportRevision[];
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
    priority: {
      type: String,
      enum: ["routine", "urgent", "stat"],
      default: "routine",
      index: true,
    },
    sampleId: { type: String, trim: true, index: true },
    sampleDocId: { type: Schema.Types.ObjectId, ref: "LabSample", index: true },
    sampleType: { type: String, trim: true },
    tubeType: { type: String, trim: true },
    barcode: { type: String, trim: true, index: true },
    sampleCollectionDate: { type: Date, required: true },
    sampleCollectedAt: { type: Date },
    sampleCollectedBy: { type: String },
    processingStartedAt: { type: Date },
    processingBy: { type: String },
    analyzerBench: { type: String },
    resultEnteredAt: { type: Date },
    submittedForReviewAt: { type: Date },
    submittedBy: { type: String },
    underReviewAt: { type: Date },
    underReviewBy: { type: String },
    correctionRequestedAt: { type: Date },
    correctionReason: { type: String },
    verifiedDate: { type: Date },
    verifiedAt: { type: Date },
    status: {
      type: String,
      enum: [
        "requested",
        "sample_pending",
        "sample_collected",
        "processing",
        "result_entered",
        "submitted_for_review",
        "under_review",
        "correction_required",
        "verified",
        "finalized",
        "pending",
        "in-progress",
      ],
      default: "requested",
      index: true,
    },
    summary: { type: String, required: true },
    technicianNotes: { type: String },
    verifiedBy: { type: String, default: "Dr. Sunita Patil, MD Pathology" },
    pathologistNotes: { type: String },
    pathologistInterpretation: { type: String },
    pathologistComments: { type: String },
    revisionHistory: {
      type: [
        {
          revisionDate: { type: Date, default: Date.now },
          revisedBy: { type: String, required: true },
          reason: { type: String, required: true },
          previousSummary: { type: String },
          previousInterpretation: { type: String },
        },
      ],
      default: [],
    },
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

