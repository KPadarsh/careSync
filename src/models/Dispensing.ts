import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDispensingItem {
  medicineId?: Types.ObjectId;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantityDispensed: number;
  unit: string;
  instructions?: string;
  batchNumber?: string;
}

export type IDispensedItem = IDispensingItem;

export type DispensingStatus =
  | "DISPENSED"
  | "PREPARING"
  | "PARTIALLY_DISPENSED"
  | "COMPLETED"
  | "CANCELLED"
  | "preparing"
  | "dispensed"
  | "completed"
  | "cancelled";

export interface IDispensing extends Document {
  dispenseId: string;
  prescriptionId: Types.ObjectId;
  encounterId?: Types.ObjectId;
  patientId: Types.ObjectId;
  pharmacistId?: Types.ObjectId;
  pharmacistName?: string;
  doctorId?: Types.ObjectId;
  items: IDispensingItem[];
  status: DispensingStatus;
  dispensedAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DispensingItemSchema = new Schema<IDispensingItem>(
  {
    medicineId: { type: Schema.Types.ObjectId, ref: "Medicine" },
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    frequency: { type: String, required: true, trim: true },
    duration: { type: String, required: true, trim: true },
    quantityDispensed: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, default: "tablets", trim: true },
    instructions: { type: String, default: "", trim: true },
    batchNumber: { type: String, trim: true },
  },
  { _id: false }
);

const DispensingSchema = new Schema<IDispensing>(
  {
    dispenseId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: IDispensing) {
        return `DSP-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Prescription",
      required: true,
      index: true,
    },
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: "Encounter",
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    pharmacistId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    pharmacistName: {
      type: String,
      trim: true,
      default: "Pharmacist",
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      index: true,
    },
    items: {
      type: [DispensingItemSchema],
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: [
        "DISPENSED",
        "PREPARING",
        "PARTIALLY_DISPENSED",
        "COMPLETED",
        "CANCELLED",
        "preparing",
        "dispensed",
        "completed",
        "cancelled",
      ],
      default: "DISPENSED",
      index: true,
    },
    dispensedAt: {
      type: Date,
      default: Date.now,
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

DispensingSchema.index({ patientId: 1, dispensedAt: -1 });

export const Dispensing: Model<IDispensing> =
  mongoose.models.Dispensing ||
  mongoose.model<IDispensing>("Dispensing", DispensingSchema);
