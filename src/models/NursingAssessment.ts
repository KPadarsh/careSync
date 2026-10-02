import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INursingVitals {
  bloodPressure?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  oxygenSaturation?: number;
  temperature?: number;
  respiratoryRate?: number;
  weightKg?: number;
  heightCm?: number;
  bmi?: number;
  painScore?: number;
  recordedAt?: Date;
  notes?: string;
}

export interface INursingAssessment extends Document {
  encounterId?: Types.ObjectId;
  patientId: Types.ObjectId;
  nurseId?: Types.ObjectId;
  nurseName?: string;
  queueId?: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  doctorId?: Types.ObjectId;
  chiefComplaint: string;
  symptoms: string[];
  observations: string;
  condition: string;
  mobility: string;
  pain?: string | number;
  painLocation?: string;
  painCharacteristics?: string;
  notes?: string;
  priority?: string;
  triagePriority?: string; // Backwards compatibility
  doctorHandoff?: string;
  doctorHandoffNotes?: string;
  generalNotes?: string;
  vitals?: INursingVitals;
  status: "DRAFT" | "COMPLETED" | "draft" | "completed";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NursingAssessmentSchema = new Schema<INursingAssessment>(
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
    nurseId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    nurseName: {
      type: String,
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
    observations: {
      type: String,
      trim: true,
      default: "Alert, oriented and responsive.",
    },
    condition: {
      type: String,
      default: "stable",
      trim: true,
    },
    mobility: {
      type: String,
      default: "independent",
      trim: true,
    },
    pain: {
      type: Schema.Types.Mixed,
      default: "0",
    },
    painLocation: {
      type: String,
      trim: true,
    },
    painCharacteristics: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      default: "normal",
      trim: true,
    },
    triagePriority: {
      type: String,
      trim: true,
    },
    doctorHandoff: {
      type: String,
      trim: true,
    },
    doctorHandoffNotes: {
      type: String,
      trim: true,
    },
    generalNotes: {
      type: String,
      trim: true,
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
    status: {
      type: String,
      enum: ["DRAFT", "COMPLETED", "draft", "completed"],
      default: "DRAFT",
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

// Pre-save synchronization
NursingAssessmentSchema.pre<INursingAssessment>("save", function () {
  if (!this.notes && this.generalNotes) {
    this.notes = this.generalNotes;
  }
  if (!this.generalNotes && this.notes) {
    this.generalNotes = this.notes;
  }
  if (!this.doctorHandoff && this.doctorHandoffNotes) {
    this.doctorHandoff = this.doctorHandoffNotes;
  }
  if (!this.doctorHandoffNotes && this.doctorHandoff) {
    this.doctorHandoffNotes = this.doctorHandoff;
  }
  if (!this.priority && this.triagePriority) {
    this.priority = this.triagePriority;
  }
  if (!this.triagePriority && this.priority) {
    this.triagePriority = this.priority;
  }
});

NursingAssessmentSchema.index({ patientId: 1, createdAt: -1 });

export const NursingAssessment: Model<INursingAssessment> =
  mongoose.models.NursingAssessment ||
  mongoose.model<INursingAssessment>("NursingAssessment", NursingAssessmentSchema);
