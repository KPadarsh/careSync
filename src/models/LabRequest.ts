import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILabRequestTest {
  testName: string;
  department?: string;
  reason?: string;
  instructions?: string;
}

export type LabRequestStatus =
  | "REQUESTED"
  | "SAMPLE_COLLECTED"
  | "PROCESSING"
  | "RESULTS_ENTERED"
  | "COMPLETED"
  | "CANCELLED"
  | "requested"
  | "completed"
  | "cancelled";

export interface ILabRequest extends Document {
  requestId: string;
  encounterId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  tests: ILabRequestTest[];
  priority: "ROUTINE" | "URGENT" | "STAT" | "routine" | "urgent" | "stat";
  status: LabRequestStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabRequestTestSchema = new Schema<ILabRequestTest>(
  {
    testName: { type: String, required: true, trim: true },
    department: { type: String, default: "Clinical Pathology", trim: true },
    reason: { type: String, trim: true },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const LabRequestSchema = new Schema<ILabRequest>(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: ILabRequest) {
        return `LRQ-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: "Encounter",
      required: true,
      index: true,
    },
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
    tests: {
      type: [LabRequestTestSchema],
      required: true,
      default: [],
    },
    priority: {
      type: String,
      enum: ["ROUTINE", "URGENT", "STAT", "routine", "urgent", "stat"],
      default: "ROUTINE",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "REQUESTED",
        "SAMPLE_COLLECTED",
        "PROCESSING",
        "RESULTS_ENTERED",
        "COMPLETED",
        "CANCELLED",
        "requested",
        "completed",
        "cancelled",
      ],
      default: "REQUESTED",
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

LabRequestSchema.index({ patientId: 1, createdAt: -1 });

export const LabRequest: Model<ILabRequest> =
  mongoose.models.LabRequest ||
  mongoose.model<ILabRequest>("LabRequest", LabRequestSchema);
