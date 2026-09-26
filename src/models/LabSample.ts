import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILabSample extends Document {
  sampleId: string; // e.g. SMP-2026-00125
  barcode: string; // Secure token / identifier (e.g. BC-9812-00125) without sensitive PHI
  patientId: Types.ObjectId;
  labReportId?: Types.ObjectId;
  testName: string;
  sampleType: "Venous Blood" | "Serum" | "Plasma" | "Urine" | "Capillary Blood" | "Swab" | "Sputum" | "Other";
  containerType: string; // e.g. "EDTA Tube (Purple)", "SST Gold", "Sodium Citrate (Blue)", "Sterile Cup"
  collectionVolume: string; // e.g. "4 mL", "10 mL"
  collectedBy: string; // Technician Name
  collectedAt: Date;
  status: "pending" | "collected" | "in-transit" | "processing" | "stored" | "rejected";
  storageLocation: string; // e.g. "Rack B-4, Cold Storage (-20°C)"
  notes?: string;
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
    barcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    labReportId: {
      type: Schema.Types.ObjectId,
      ref: "LabReport",
      index: true,
    },
    testName: {
      type: String,
      required: true,
      trim: true,
    },
    sampleType: {
      type: String,
      enum: [
        "Venous Blood",
        "Serum",
        "Plasma",
        "Urine",
        "Capillary Blood",
        "Swab",
        "Sputum",
        "Other",
      ],
      default: "Venous Blood",
    },
    containerType: {
      type: String,
      default: "EDTA Tube (Purple Top)",
      trim: true,
    },
    collectionVolume: {
      type: String,
      default: "4 mL",
      trim: true,
    },
    collectedBy: {
      type: String,
      required: true,
      trim: true,
    },
    collectedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "collected", "in-transit", "processing", "stored", "rejected"],
      default: "collected",
      index: true,
    },
    storageLocation: {
      type: String,
      default: "Rack A-1, Lab Refrigerator 4°C",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const LabSample: Model<ILabSample> =
  mongoose.models.LabSample ||
  mongoose.model<ILabSample>("LabSample", LabSampleSchema);
