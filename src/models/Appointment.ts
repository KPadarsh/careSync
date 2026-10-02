import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_QUEUE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "scheduled"
  | "confirmed"
  | "checked-in"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "rescheduled";

export type AppointmentBookedBy =
  | "PATIENT"
  | "RECEPTIONIST"
  | "RECEPTION"
  | "DOCTOR"
  | "patient"
  | "receptionist";

export interface IAppointment extends Document {
  appointmentId: string;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  departmentId?: Types.ObjectId;
  date: Date;
  startTime?: string;
  endTime?: string;
  timeSlot: string;
  type?:
    | "in-person"
    | "video-consultation"
    | "teleconsultation"
    | "follow-up"
    | "routine-checkup";
  reason: string;
  bookedBy: AppointmentBookedBy;
  status: AppointmentStatus;
  cancellationReason?: string;
  rescheduledFrom?: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    appointmentId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: IAppointment) {
        return `APT-${Math.floor(10000 + Math.random() * 90000)}`;
      },
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
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    timeSlot: {
      type: String,
      trim: true,
      default: function (this: IAppointment) {
        return this.startTime || "09:00 AM";
      },
    },
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
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "SCHEDULED",
        "CONFIRMED",
        "CHECKED_IN",
        "IN_QUEUE",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
        "scheduled",
        "confirmed",
        "checked-in",
        "in-progress",
        "completed",
        "cancelled",
        "rescheduled",
      ],
      default: "CONFIRMED",
      index: true,
    },
    bookedBy: {
      type: String,
      enum: ["PATIENT", "RECEPTIONIST", "RECEPTION", "DOCTOR", "patient", "receptionist"],
      default: "PATIENT",
      required: true,
    },
    cancellationReason: { type: String, trim: true },
    rescheduledFrom: { type: Schema.Types.ObjectId, ref: "Appointment" },
    notes: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.index({ doctorId: 1, date: 1, status: 1 });

export const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);
