import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILabSample extends Document {
  sampleId: string; // e.g. SMP-2026-00125
  labReportId: Types.ObjectId; // Ref: LabReport
  patientId: Types.ObjectId; // Ref: Patient
  doctorId?: Types.ObjectId; // Ref: Doctor
  testName: string;
  department: string;
  specimenType: string; // e.g. Venous Blood, Serum, Urine, Plasma, CSF, Sputum
  tubeType: string; // e.g. Lavender Top (EDTA), Gold Top (SST), Light Blue (Sodium Citrate)
  barcode: string; // e.g. CS-SMP-2026-00125-T792 (Secure token, does NOT encode patient PII)
  barcodeToken: string; // Secure token for fast scanner lookup
  collectionSite: string; // e.g. Phlebotomy Station 2
  collectedAt: Date;
  collectedBy: string; // e.g. Vikram Malhotra, MLT
  storageLocation: string; // e.g. Rack C-04 / Shelf 2 (Cold 4°C)
  volume?: string; // e.g. 4.0 mL
  status:
    | "pending"
    | "collected"
    | "processing"
    | "analyzed"
    | "stored"
    | "disposed"
    | "rejected";
  rejectionReason?: string;
  technicianNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LabSampleSchema = new Schema<ILabSample>(
  {
    sampleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    labReportId: {
      type: Schema.Types.ObjectId,
      ref: "LabReport",
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
      index: true,
    },
    testName: { type: String, required: true, trim: true },
    department: {
      type: String,
      default: "Pathology / Clinical Chemistry",
      trim: true,
    },
    specimenType: {
      type: String,
      required: true,
      default: "Venous Blood",
      trim: true,
    },
    tubeType: {
      type: String,
      required: true,
      default: "Lavender Top (EDTA)",
      trim: true,
    },
    barcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    barcodeToken: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    collectionSite: {
      type: String,
      default: "Central Phlebotomy Station 2",
      trim: true,
    },
    collectedAt: { type: Date, default: Date.now },
    collectedBy: {
      type: String,
      default: "Vikram Malhotra, MLT",
      trim: true,
    },
    storageLocation: {
      type: String,
      default: "Rack A-01 / Ambient Storage",
      trim: true,
    },
    volume: { type: String, default: "4.0 mL" },
    status: {
      type: String,
      enum: [
        "pending",
        "collected",
        "processing",
        "analyzed",
        "stored",
        "disposed",
        "rejected",
      ],
      default: "collected",
      index: true,
    },
    rejectionReason: { type: String },
    technicianNotes: { type: String },
  },
  {
    timestamps: true,
  }
);

export const LabSample: Model<ILabSample> =
  mongoose.models.LabSample ||
  mongoose.model<ILabSample>("LabSample", LabSampleSchema);
