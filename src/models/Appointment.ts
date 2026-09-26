import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAppointment extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  date: Date;
  timeSlot: string;
  type:
    | "in-person"
    | "video-consultation"
    | "teleconsultation"
    | "follow-up"
    | "routine-checkup";
  reason: string;
  status:
    | "scheduled"
    | "confirmed"
    | "checked-in"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "rescheduled";
  bookedBy: "PATIENT" | "RECEPTION" | "RECEPTIONIST" | "DOCTOR";
  cancellationReason?: string;
  rescheduledFrom?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
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
    date: { type: Date, required: true, index: true },
    timeSlot: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "in-person",
        "video-consultation",
        "teleconsultation",
        "follow-up",
        "routine-checkup",
      ],
      default: "in-person",
    },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [
        "scheduled",
        "confirmed",
        "checked-in",
        "in-progress",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      default: "confirmed",
      index: true,
    },
    bookedBy: {
      type: String,
      enum: ["PATIENT", "RECEPTION", "RECEPTIONIST", "DOCTOR"],
      default: "PATIENT",
      required: true,
    },
    cancellationReason: { type: String },
    rescheduledFrom: { type: Schema.Types.ObjectId, ref: "Appointment" },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound index to check doctor slot availability
AppointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1, status: 1 });

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);
