import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INursingVitals {
  bloodPressure?: string; // e.g. "120/80"
  systolic?: number;
  diastolic?: number;
  heartRate?: number; // bpm
  oxygenSaturation?: number; // % (SpO2)
  temperature?: number; // Fahrenheit
  respiratoryRate?: number; // breaths/min
  weightKg?: number; // kg
  heightCm?: number; // cm
  bmi?: number;
  painScore?: number; // 0-10
  recordedAt?: Date;
  notes?: string;
}

export interface INursingAssessment extends Document {
  patientId: Types.ObjectId;
  nurseId?: Types.ObjectId;
  nurseName: string;
  queueId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  doctorId?: Types.ObjectId;
  vitals: INursingVitals;
  chiefComplaint: string;
  symptoms: string[];
  painLocation?: string;
  painCharacteristics?: string;
  observations: string;
  condition: "stable" | "critical" | "needs-monitoring" | "acute";
  mobility: "independent" | "assisted" | "wheelchair" | "stretcher" | "bedridden";
  triagePriority: "normal" | "priority" | "urgent";
  doctorHandoffNotes?: string;
  generalNotes?: string;
  status: "draft" | "completed";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NursingAssessmentSchema = new Schema<INursingAssessment>(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    nurseId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    nurseName: {
      type: String,
      default: "Arun Mary, RN",
      trim: true,
    },
    queueId: {
      type: Schema.Types.ObjectId,
      ref: "Queue",
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      index: true,
    },
    vitals: {
      bloodPressure: { type: String, trim: true },
      systolic: { type: Number },
      diastolic: { type: Number },
      heartRate: { type: Number },
      oxygenSaturation: { type: Number },
      temperature: { type: Number },
      respiratoryRate: { type: Number },
      weightKg: { type: Number },
      heightCm: { type: Number },
      bmi: { type: Number },
      painScore: { type: Number, min: 0, max: 10, default: 0 },
      recordedAt: { type: Date, default: Date.now },
      notes: { type: String, trim: true },
    },
    chiefComplaint: {
      type: String,
      required: true,
      trim: true,
      default: "Routine clinical assessment",
    },
    symptoms: {
      type: [String],
      default: [],
    },
    painLocation: {
      type: String,
      trim: true,
    },
    painCharacteristics: {
      type: String,
      trim: true,
    },
    observations: {
      type: String,
      trim: true,
      default: "Alert, oriented and responsive.",
    },
    condition: {
      type: String,
      enum: ["stable", "critical", "needs-monitoring", "acute"],
      default: "stable",
      index: true,
    },
    mobility: {
      type: String,
      enum: ["independent", "assisted", "wheelchair", "stretcher", "bedridden"],
      default: "independent",
    },
    triagePriority: {
      type: String,
      enum: ["normal", "priority", "urgent"],
      default: "normal",
      index: true,
    },
    doctorHandoffNotes: {
      type: String,
      trim: true,
    },
    generalNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
      index: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

NursingAssessmentSchema.index({ patientId: 1, createdAt: -1 });
NursingAssessmentSchema.index({ status: 1, createdAt: -1 });

export const NursingAssessment: Model<INursingAssessment> =
  mongoose.models.NursingAssessment ||
  mongoose.model<INursingAssessment>("NursingAssessment", NursingAssessmentSchema);
