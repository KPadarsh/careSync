import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type QueueStatus =
  | "WAITING"
  | "IN_ASSESSMENT"
  | "READY_FOR_DOCTOR"
  | "IN_CONSULTATION"
  | "COMPLETED"
  | "waiting"
  | "in-assessment"
  | "ready-for-doctor"
  | "in-consultation"
  | "completed"
  | "called"
  | "cancelled";

export type QueuePriority =
  | "NORMAL"
  | "PRIORITY"
  | "URGENT"
  | "normal"
  | "priority"
  | "urgent"
  | "vip";

export interface IQueue extends Document {
  encounterId?: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  ticketNumber: string;
  department?: string;
  roomNumber?: string;
  status: QueueStatus;
  priority: QueuePriority;
  source?: "appointment" | "walk-in" | string;
  checkedInAt: Date;
  checkedInTime: Date;
  calledTime?: Date;
  startedAt?: Date;
  completedAt?: Date;
  completedTime?: Date; // Backwards compatibility
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QueueSchema = new Schema<IQueue>(
  {
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: "Encounter",
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
    ticketNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
      default: function (this: IQueue) {
        return `Q-${Math.floor(100 + Math.random() * 900)}`;
      },
    },
    department: {
      type: String,
      trim: true,
      default: "General OPD",
    },
    roomNumber: {
      type: String,
      trim: true,
      default: "Room 101",
    },
    status: {
      type: String,
      enum: [
        "WAITING",
        "IN_ASSESSMENT",
        "READY_FOR_DOCTOR",
        "IN_CONSULTATION",
        "COMPLETED",
        "waiting",
        "in-assessment",
        "ready-for-doctor",
        "in-consultation",
        "completed",
        "called",
        "cancelled",
      ],
      default: "WAITING",
      index: true,
    },
    priority: {
      type: String,
      enum: ["NORMAL", "PRIORITY", "URGENT", "normal", "priority", "urgent", "vip"],
      default: "NORMAL",
      index: true,
    },
    source: {
      type: String,
      enum: ["appointment", "walk-in"],
      default: "appointment",
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    checkedInTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    calledTime: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
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

QueueSchema.pre<IQueue>("save", function () {
  if (!this.checkedInAt && this.checkedInTime) {
    this.checkedInAt = this.checkedInTime;
  }
  if (!this.checkedInTime && this.checkedInAt) {
    this.checkedInTime = this.checkedInAt;
  }
  if (!this.completedAt && this.completedTime) {
    this.completedAt = this.completedTime;
  }
  if (!this.completedTime && this.completedAt) {
    this.completedTime = this.completedAt;
  }
});

QueueSchema.index({ doctorId: 1, status: 1, checkedInAt: 1 });

export const Queue: Model<IQueue> =
  mongoose.models.Queue || mongoose.model<IQueue>("Queue", QueueSchema);
