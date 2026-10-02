import mongoose, { Schema, Document, Model, Types } from "mongoose";

// Visit is maintained as a compatible alias for Encounter in Phase 2
export interface IVisit extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  encounterId?: string;
  visitDate: Date;
  visitType?: string;
  reason: string;
  diagnosis: string;
  summary: string;
  internalNotes?: string;
  status: "completed" | "in-progress" | "cancelled" | "COMPLETED" | "IN_PROGRESS" | "CANCELLED";
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
    encounterId: { type: String, trim: true },
    visitDate: { type: Date, required: true, default: Date.now, index: true },
    visitType: { type: String, default: "OPD" },
    reason: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    internalNotes: { type: String },
    status: {
      type: String,
      enum: ["completed", "in-progress", "cancelled", "COMPLETED", "IN_PROGRESS", "CANCELLED"],
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

VisitSchema.index({ patientId: 1, visitDate: -1 });

export const Visit: Model<IVisit> =
  mongoose.models.Visit || mongoose.model<IVisit>("Visit", VisitSchema);
