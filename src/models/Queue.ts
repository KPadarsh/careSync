import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IQueue extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  ticketNumber: string;
  department: string;
  roomNumber?: string;
  status: "waiting" | "in-assessment" | "ready-for-doctor" | "in-consultation" | "completed" | "called" | "cancelled";
  priority: "normal" | "priority" | "urgent" | "vip";
  source: "appointment" | "walk-in";
  checkedInTime: Date;
  calledTime?: Date;
  completedTime?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QueueSchema = new Schema<IQueue>(
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
      index: true,
    },
    ticketNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
      default: "Room 302",
    },
    status: {
      type: String,
      enum: ["waiting", "in-assessment", "ready-for-doctor", "in-consultation", "completed", "called", "cancelled"],
      default: "waiting",
      index: true,
    },
    priority: {
      type: String,
      enum: ["normal", "priority", "urgent", "vip"],
      default: "normal",
      index: true,
    },
    source: {
      type: String,
      enum: ["appointment", "walk-in"],
      default: "appointment",
    },
    checkedInTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    calledTime: {
      type: Date,
    },
    completedTime: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

QueueSchema.index({ doctorId: 1, status: 1, checkedInTime: 1 });

if (mongoose.models.Queue) {
  delete (mongoose.models as any).Queue;
}

export const Queue: Model<IQueue> =
  mongoose.models.Queue || mongoose.model<IQueue>("Queue", QueueSchema);
