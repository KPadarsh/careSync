import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IVital extends Document {
  encounterId?: Types.ObjectId;
  patientId: Types.ObjectId;
  recordedBy?: Types.ObjectId;
  bloodPressure?: string; // e.g. "120/80"
  heartRate?: number; // bpm
  spo2?: number; // % (SpO2)
  temperature?: number; // °F or °C
  respiratoryRate?: number; // breaths/min
  weight?: number; // kg
  height?: number; // cm
  painScore?: number; // 0-10
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VitalSchema = new Schema<IVital>(
  {
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: "Encounter",
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    bloodPressure: {
      type: String,
      trim: true,
    },
    heartRate: {
      type: Number,
      min: 0,
      max: 300,
    },
    spo2: {
      type: Number,
      min: 0,
      max: 100,
    },
    temperature: {
      type: Number,
      min: 50,
      max: 120,
    },
    respiratoryRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    weight: {
      type: Number,
      min: 0,
    },
    height: {
      type: Number,
      min: 0,
    },
    painScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

VitalSchema.index({ patientId: 1, recordedAt: -1 });

export const Vital: Model<IVital> =
  mongoose.models.Vital || mongoose.model<IVital>("Vital", VitalSchema);
