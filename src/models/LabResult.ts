import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILabResultParameter {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "normal" | "high" | "low" | "critical" | "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
}

export type LabResultStatus =
  | "ENTERED"
  | "VERIFIED"
  | "COMPLETED"
  | "CORRECTION_REQUIRED"
  | "entered"
  | "verified"
  | "completed";

export interface ILabResult extends Document {
  resultId: string;
  labRequestId: Types.ObjectId;
  sampleId?: Types.ObjectId;
  sampleNumber?: string;
  patientId: Types.ObjectId;
  results: ILabResultParameter[];
  enteredBy?: Types.ObjectId;
  enteredAt?: Date;
  status: LabResultStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabResultParameterSchema = new Schema<ILabResultParameter>(
  {
    parameter: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    referenceRange: { type: String, required: true, trim: true },
    flag: {
      type: String,
      enum: ["normal", "high", "low", "critical", "NORMAL", "HIGH", "LOW", "CRITICAL"],
      default: "normal",
    },
  },
  { _id: false }
);

const LabResultSchema = new Schema<ILabResult>(
  {
    resultId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: ILabResult) {
        return `LRS-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    labRequestId: {
      type: Schema.Types.ObjectId,
      ref: "LabRequest",
      required: true,
      index: true,
    },
    sampleId: {
      type: Schema.Types.ObjectId,
      ref: "LabSample",
      index: true,
    },
    sampleNumber: {
      type: String,
      trim: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    results: {
      type: [LabResultParameterSchema],
      required: true,
      default: [],
    },
    enteredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    enteredAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: [
        "ENTERED",
        "VERIFIED",
        "COMPLETED",
        "CORRECTION_REQUIRED",
        "entered",
        "verified",
        "completed",
      ],
      default: "ENTERED",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

LabResultSchema.index({ patientId: 1, createdAt: -1 });

export const LabResult: Model<ILabResult> =
  mongoose.models.LabResult ||
  mongoose.model<ILabResult>("LabResult", LabResultSchema);
