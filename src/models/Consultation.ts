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
  timeframe?: string;
  reason?: string;
  clinicalInstructions?: string;
}

export interface IConsultation extends Document {
  encounterId?: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  queueId?: Types.ObjectId;
  chiefComplaint: string;
  clinicalFindings?: string;
  clinicalExamination?: string; // Backwards compatibility
  historyOfPresentIllness?: string;
  diagnosis: string;
  icdCode?: string;
  differentialDiagnoses?: string[];
  treatmentPlan: string;
  notes?: string;
  followUpRequired?: boolean;
  followUpDate?: Date;
  followUp?: IConsultationFollowUp;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    oxygenSaturation?: number;
    temperature?: number;
    respiratoryRate?: number;
    weightKg?: number;
    painScore?: number;
  };
  medications?: IConsultationMedication[];
  labOrders?: IConsultationLabOrder[];
  status: "DRAFT" | "COMPLETED" | "draft" | "completed";
  startedAt?: Date;
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
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      index: true,
    },
    queueId: {
      type: Schema.Types.ObjectId,
      ref: "Queue",
    },
    chiefComplaint: {
      type: String,
      default: "",
      trim: true,
    },
    clinicalFindings: {
      type: String,
      default: "",
      trim: true,
    },
    clinicalExamination: {
      type: String,
      default: "",
      trim: true,
    },
    historyOfPresentIllness: {
      type: String,
      default: "",
      trim: true,
    },
    diagnosis: {
      type: String,
      default: "",
      trim: true,
    },
    icdCode: {
      type: String,
      default: "",
      trim: true,
    },
    differentialDiagnoses: {
      type: [String],
      default: [],
    },
    treatmentPlan: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    followUpRequired: {
      type: Boolean,
      default: false,
    },
    followUpDate: {
      type: Date,
    },
    followUp: {
      type: ConsultationFollowUpSchema,
      default: () => ({ needed: false }),
    },
    vitals: {
      bloodPressure: { type: String },
      heartRate: { type: Number },
      oxygenSaturation: { type: Number },
      temperature: { type: Number },
      respiratoryRate: { type: Number },
      weightKg: { type: Number },
      painScore: { type: Number },
    },
    medications: {
      type: [ConsultationMedicationSchema],
      default: [],
    },
    labOrders: {
      type: [ConsultationLabOrderSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["DRAFT", "COMPLETED", "draft", "completed"],
      default: "DRAFT",
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

ConsultationSchema.pre<IConsultation>("save", function () {
  if (!this.clinicalFindings && this.clinicalExamination) {
    this.clinicalFindings = this.clinicalExamination;
  }
  if (!this.clinicalExamination && this.clinicalFindings) {
    this.clinicalExamination = this.clinicalFindings;
  }
  if (this.followUp && this.followUp.needed) {
    this.followUpRequired = true;
    if (this.followUp.recommendedDate) {
      this.followUpDate = this.followUp.recommendedDate;
    }
  }
});

ConsultationSchema.index({ patientId: 1, createdAt: -1 });
ConsultationSchema.index({ doctorId: 1, createdAt: -1 });

export const Consultation: Model<IConsultation> =
  mongoose.models.Consultation ||
  mongoose.model<IConsultation>("Consultation", ConsultationSchema);
