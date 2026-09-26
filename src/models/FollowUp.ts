import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IFollowUp extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  visitId?: Types.ObjectId;
  recommendedDate: Date;
  reason: string;
  clinicalInstructions: string;
  status: "pending" | "scheduled" | "completed" | "dismissed";
  scheduledAppointmentId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
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
    visitId: { type: Schema.Types.ObjectId, ref: "Visit" },
    recommendedDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    clinicalInstructions: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "scheduled", "completed", "dismissed"],
      default: "pending",
      index: true,
    },
    scheduledAppointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
    },
  },
  {
    timestamps: true,
  }
);

export const FollowUp: Model<IFollowUp> =
  mongoose.models.FollowUp ||
  mongoose.model<IFollowUp>("FollowUp", FollowUpSchema);
