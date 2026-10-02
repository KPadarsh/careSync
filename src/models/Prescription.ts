import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPrescriptionItem {
  medicineId?: Types.ObjectId;
  medicineName: string;
  medicine: string; // Non-optional for pharmacy & doctor API routes
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refillsRemaining?: number;
}

export type PrescriptionStatus =
  | "ACTIVE"
  | "PENDING"
  | "REVIEWED"
  | "DISPENSED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISCONTINUED"
  | "pending"
  | "reviewed"
  | "ready"
  | "dispensing"
  | "dispensed"
  | "completed"
  | "clarification_requested"
  | "active"
  | "discontinued";

export interface IPrescription extends Document {
  prescriptionId: string;
  encounterId?: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  visitId?: Types.ObjectId;
  items: IPrescriptionItem[];
  medications: IPrescriptionItem[];
  instructions?: string;
  notes?: string;
  pharmacistNotes?: string;
  clarificationReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  dispensingRecordId?: Types.ObjectId;
  date: Date;
  status: PrescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionItemSchema = new Schema<IPrescriptionItem>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: "Medicine",
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
      default: function (this: IPrescriptionItem) {
        return this.medicine || "Prescribed Medicine";
      },
    },
    medicine: {
      type: String,
      required: true,
      trim: true,
      default: function (this: IPrescriptionItem) {
        return this.medicineName || "Prescribed Medicine";
      },
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
      trim: true,
    },
    instructions: {
      type: String,
      required: true,
      trim: true,
      default: "As directed by physician",
    },
    refillsRemaining: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescription>(
  {
    prescriptionId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: IPrescription) {
        return `RX-${Math.floor(10000 + Math.random() * 90000)}`;
      },
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
      required: true,
      index: true,
    },
    visitId: {
      type: Schema.Types.ObjectId,
      ref: "Visit",
    },
    items: {
      type: [PrescriptionItemSchema],
      required: true,
      default: [],
    },
    medications: {
      type: [PrescriptionItemSchema],
      required: true,
      default: [],
    },
    instructions: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
    },
    pharmacistNotes: {
      type: String,
      trim: true,
    },
    clarificationReason: {
      type: String,
      trim: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: {
      type: Date,
    },
    dispensingRecordId: {
      type: Schema.Types.ObjectId,
      ref: "DispensingRecord",
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "ACTIVE",
        "PENDING",
        "REVIEWED",
        "DISPENSED",
        "COMPLETED",
        "CANCELLED",
        "DISCONTINUED",
        "pending",
        "reviewed",
        "ready",
        "dispensing",
        "dispensed",
        "completed",
        "clarification_requested",
        "active",
        "discontinued",
      ],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

PrescriptionSchema.pre<IPrescription>("save", function () {
  if ((!this.items || this.items.length === 0) && this.medications && this.medications.length > 0) {
    this.items = this.medications.map((m) => ({
      medicineId: m.medicineId,
      medicineName: m.medicineName || m.medicine || "Prescribed Medicine",
      medicine: m.medicine || m.medicineName || "Prescribed Medicine",
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions,
      refillsRemaining: m.refillsRemaining || 0,
    }));
  } else if ((!this.medications || this.medications.length === 0) && this.items && this.items.length > 0) {
    this.medications = this.items.map((i) => ({
      medicine: i.medicine || i.medicineName,
      medicineName: i.medicineName,
      dosage: i.dosage,
      frequency: i.frequency,
      duration: i.duration,
      instructions: i.instructions,
      refillsRemaining: i.refillsRemaining || 0,
    }));
  }
});

PrescriptionSchema.index({ patientId: 1, date: -1 });
PrescriptionSchema.index({ doctorId: 1, date: -1 });

export const Prescription: Model<IPrescription> =
  mongoose.models.Prescription ||
  mongoose.model<IPrescription>("Prescription", PrescriptionSchema);
