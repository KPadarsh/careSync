import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ILabSample extends Document {
  sampleId: string;
  labRequestId?: Types.ObjectId;
  labReportId?: Types.ObjectId; // Backwards compatibility
  patientId: Types.ObjectId;
  encounterId?: Types.ObjectId;
  doctorId?: Types.ObjectId;
  testName: string;
  department: string;
  specimenType: string;
  tubeType: string;
  barcode: string;
  barcodeToken?: string;
  collectionSite?: string;
  collectedAt: Date;
  collectedBy?: string;
  storageLocation?: string;
  volume?: string;
  status:
    | "PENDING"
    | "COLLECTED"
    | "PROCESSING"
    | "ANALYZED"
    | "STORED"
    | "DISPOSED"
    | "REJECTED"
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
    labRequestId: {
      type: Schema.Types.ObjectId,
      ref: "LabRequest",
      index: true,
    },
    labReportId: {
      type: Schema.Types.ObjectId,
      ref: "LabReport",
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: "Encounter",
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
      trim: true,
      default: function (this: ILabSample) {
        return this.barcode;
      },
    },
    collectionSite: {
      type: String,
      default: "Central Phlebotomy Station",
      trim: true,
    },
    collectedAt: { type: Date, default: Date.now },
    collectedBy: {
      type: String,
      default: "Lab Technician",
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
        "PENDING",
        "COLLECTED",
        "PROCESSING",
        "ANALYZED",
        "STORED",
        "DISPOSED",
        "REJECTED",
        "pending",
        "collected",
        "processing",
        "analyzed",
        "stored",
        "disposed",
        "rejected",
      ],
      default: "COLLECTED",
      index: true,
    },
    rejectionReason: { type: String, trim: true },
    technicianNotes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

export const LabSample: Model<ILabSample> =
  mongoose.models.LabSample ||
  mongoose.model<ILabSample>("LabSample", LabSampleSchema);
