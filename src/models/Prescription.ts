import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMedicationItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refillsRemaining: number;
}

export interface IPrescription extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  visitId?: Types.ObjectId;
  date: Date;
  status: "active" | "completed" | "discontinued";
  medications: IMedicationItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationItemSchema = new Schema<IMedicationItem>(
  {
    medicine: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    instructions: { type: String, required: true, trim: true },
    refillsRemaining: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
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
    visitId: { type: Schema.Types.ObjectId, ref: "Visit" },
    date: { type: Date, required: true, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["active", "completed", "discontinued"],
      default: "active",
      index: true,
    },
    medications: { type: [MedicationItemSchema], required: true },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Prescription: Model<IPrescription> =
  mongoose.models.Prescription ||
  mongoose.model<IPrescription>("Prescription", PrescriptionSchema);
