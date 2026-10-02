import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type EncounterStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "in-progress"
  | "completed"
  | "cancelled";

export interface IEncounter extends Document {
  encounterId: string;
  patientId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  doctorId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  visitDate: Date;
  visitType: "OPD" | "FOLLOW_UP" | "EMERGENCY" | "ROUTINE" | string;
  reason?: string;
  diagnosis?: string;
  summary?: string;
  internalNotes?: string;
  status: EncounterStatus;
  createdAt: Date;
  updatedAt: Date;
}

const EncounterSchema = new Schema<IEncounter>(
  {
    encounterId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: IEncounter) {
        return `ENC-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    visitDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    visitType: {
      type: String,
      required: true,
      default: "OPD",
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "General Consultation",
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    internalNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["IN_PROGRESS", "COMPLETED", "CANCELLED", "in-progress", "completed", "cancelled"],
      default: "IN_PROGRESS",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

EncounterSchema.index({ doctorId: 1, visitDate: -1 });

export const Encounter: Model<IEncounter> =
  mongoose.models.Encounter ||
  mongoose.model<IEncounter>("Encounter", EncounterSchema);
