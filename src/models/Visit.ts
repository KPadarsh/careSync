import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IVisit extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  visitDate: Date;
  reason: string;
  diagnosis: string;
  summary: string; // Patient-accessible summary
  internalNotes?: string; // Staff-only notes (stripped in patient APIs)
  status: "completed" | "in-progress" | "cancelled";
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    weightKg?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisit>(
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
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    visitDate: { type: Date, required: true, default: Date.now, index: true },
    reason: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    internalNotes: { type: String }, // Filtered out from patient query
    status: {
      type: String,
      enum: ["completed", "in-progress", "cancelled"],
      default: "completed",
      index: true,
    },
    vitals: {
      bloodPressure: { type: String },
      heartRate: { type: Number },
      temperature: { type: Number },
      oxygenSaturation: { type: Number },
      weightKg: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

export const Visit: Model<IVisit> =
  mongoose.models.Visit || mongoose.model<IVisit>("Visit", VisitSchema);
