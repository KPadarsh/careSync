import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IMedicalRecord extends Document {
  patientId: Types.ObjectId;
  doctorId?: Types.ObjectId;
  title: string;
  category:
    | "consultation"
    | "discharge-summary"
    | "clinical-note"
    | "immunization"
    | "imaging";
  recordDate: Date;
  facility: string;
  summary: string;
  fileUrl?: string;
  isStaffOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        "consultation",
        "discharge-summary",
        "clinical-note",
        "immunization",
        "imaging",
      ],
      default: "consultation",
      index: true,
    },
    recordDate: { type: Date, required: true, default: Date.now },
    facility: { type: String, default: "CareSync Central Clinic" },
    summary: { type: String, required: true, trim: true },
    fileUrl: { type: String },
    isStaffOnly: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

export const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord ||
  mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);
