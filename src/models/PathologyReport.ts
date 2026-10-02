import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PathologyReportStatus =
  | "DRAFT"
  | "VERIFIED"
  | "FINALIZED"
  | "CORRECTION_REQUESTED"
  | "draft"
  | "verified"
  | "finalized";

export interface IPathologyReport extends Document {
  reportId: string;
  labResultId?: Types.ObjectId;
  labRequestId?: Types.ObjectId;
  patientId: Types.ObjectId;
  pathologistId?: Types.ObjectId;
  findings?: string;
  interpretation?: string;
  comments?: string;
  clinicalCorrelation?: string;
  status: PathologyReportStatus;
  verifiedAt?: Date;
  finalizedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PathologyReportSchema = new Schema<IPathologyReport>(
  {
    reportId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: IPathologyReport) {
        return `PTH-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    labResultId: {
      type: Schema.Types.ObjectId,
      ref: "LabResult",
      index: true,
    },
    labRequestId: {
      type: Schema.Types.ObjectId,
      ref: "LabRequest",
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    pathologistId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    findings: {
      type: String,
      trim: true,
      default: "",
    },
    interpretation: {
      type: String,
      trim: true,
      default: "",
    },
    comments: {
      type: String,
      trim: true,
      default: "",
    },
    clinicalCorrelation: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "DRAFT",
        "VERIFIED",
        "FINALIZED",
        "CORRECTION_REQUESTED",
        "draft",
        "verified",
        "finalized",
      ],
      default: "DRAFT",
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    finalizedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

PathologyReportSchema.index({ patientId: 1, createdAt: -1 });

export const PathologyReport: Model<IPathologyReport> =
  mongoose.models.PathologyReport ||
  mongoose.model<IPathologyReport>("PathologyReport", PathologyReportSchema);
