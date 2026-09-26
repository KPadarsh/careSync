import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INurseTask extends Document {
  title: string;
  description?: string;
  patientId?: Types.ObjectId;
  patientName?: string;
  nurseId?: Types.ObjectId;
  nurseName?: string;
  roomNumber?: string;
  dueTime: string; // e.g. "10:30 AM" or ISO
  priority: "normal" | "urgent";
  status: "pending" | "in-progress" | "completed";
  category: "medication" | "vitals" | "wound-care" | "handoff" | "triage" | "general";
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NurseTaskSchema = new Schema<INurseTask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      index: true,
    },
    patientName: {
      type: String,
      trim: true,
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
    roomNumber: {
      type: String,
      trim: true,
      default: "Room 302",
    },
    dueTime: {
      type: String,
      required: true,
      default: "11:00 AM",
    },
    priority: {
      type: String,
      enum: ["normal", "urgent"],
      default: "normal",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
      index: true,
    },
    category: {
      type: String,
      enum: ["medication", "vitals", "wound-care", "handoff", "triage", "general"],
      default: "general",
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

NurseTaskSchema.index({ status: 1, priority: 1, createdAt: -1 });

export const NurseTask: Model<INurseTask> =
  mongoose.models.NurseTask || mongoose.model<INurseTask>("NurseTask", NurseTaskSchema);
