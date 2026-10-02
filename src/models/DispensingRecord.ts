import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { IDispensedItem, DispensingStatus } from "./Dispensing";

export interface IDispensingRecord extends Document {
  dispenseId: string;
  prescriptionId: Types.ObjectId;
  encounterId?: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId?: Types.ObjectId;
  pharmacistId?: Types.ObjectId;
  pharmacistName: string;
  items: IDispensedItem[];
  dispensedDate: Date;
  status: DispensingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DispensedItemSchema = new Schema<IDispensedItem>(
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

const DispensingRecordSchema = new Schema<IDispensingRecord>(
  {
    dispenseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
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
      index: true,
    },
    pharmacistId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    pharmacistName: {
      type: String,
      required: true,
      trim: true,
      default: "Pharmacist",
    },
    items: {
      type: [DispensedItemSchema],
      required: true,
    },
    dispensedDate: {
      type: Date,
      default: Date.now,
      index: true,
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
      default: "preparing",
      index: true,
    },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export const DispensingRecord: Model<IDispensingRecord> =
  mongoose.models.DispensingRecord ||
  mongoose.model<IDispensingRecord>("DispensingRecord", DispensingRecordSchema);
