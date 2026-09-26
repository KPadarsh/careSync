import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IConsultationMedication {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface IConsultationLabOrder {
  testName: string;
  reason: string;
  priority: "routine" | "urgent" | "stat";
  instructions?: string;
}

export interface IConsultationFollowUp {
  needed: boolean;
  recommendedDate?: Date;
  timeframe?: string; // e.g. "2 weeks", "1 month"
  reason?: string;
  clinicalInstructions?: string;
}

export interface IConsultation extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  queueId?: Types.ObjectId;
  status: "draft" | "completed";
  chiefComplaint: string;
  historyOfPresentIllness: string;
  clinicalExamination: string;
  diagnosis: string;
  icdCode?: string;
  differentialDiagnoses: string[];
  treatmentPlan: string;
  notes?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    oxygenSaturation?: number;
    temperature?: number;
    respiratoryRate?: number;
    weightKg?: number;
    painScore?: number;
  };
  medications: IConsultationMedication[];
  labOrders: IConsultationLabOrder[];
  followUp: IConsultationFollowUp;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationMedicationSchema = new Schema<IConsultationMedication>(
  {
    medicine: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
    instructions: { type: String, required: true },
  },
  { _id: false }
);

const ConsultationLabOrderSchema = new Schema<IConsultationLabOrder>(
  {
    testName: { type: String, required: true },
    reason: { type: String, required: true },
    priority: {
      type: String,
      enum: ["routine", "urgent", "stat"],
      default: "routine",
    },
    instructions: { type: String },
  },
  { _id: false }
);

const ConsultationFollowUpSchema = new Schema<IConsultationFollowUp>(
  {
    needed: { type: Boolean, default: false },
    recommendedDate: { type: Date },
    timeframe: { type: String },
    reason: { type: String },
    clinicalInstructions: { type: String },
  },
  { _id: false }
);

const ConsultationSchema = new Schema<IConsultation>(
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
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
    queueId: {
      type: Schema.Types.ObjectId,
      ref: "Queue",
    },
    status: {
      type: String,
      enum: ["draft", "completed"],
      default: "draft",
      index: true,
    },
    chiefComplaint: { type: String, default: "" },
    historyOfPresentIllness: { type: String, default: "" },
    clinicalExamination: { type: String, default: "" },
    diagnosis: { type: String, default: "" },
    icdCode: { type: String, default: "" },
    differentialDiagnoses: { type: [String], default: [] },
    treatmentPlan: { type: String, default: "" },
    notes: { type: String, default: "" },
    vitals: {
      bloodPressure: { type: String },
      heartRate: { type: Number },
      oxygenSaturation: { type: Number },
      temperature: { type: Number },
      respiratoryRate: { type: Number },
      weightKg: { type: Number },
      painScore: { type: Number },
    },
    medications: { type: [ConsultationMedicationSchema], default: [] },
    labOrders: { type: [ConsultationLabOrderSchema], default: [] },
    followUp: { type: ConsultationFollowUpSchema, default: () => ({ needed: false }) },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Consultation: Model<IConsultation> =
  mongoose.models.Consultation ||
  mongoose.model<IConsultation>("Consultation", ConsultationSchema);
