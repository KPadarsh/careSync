import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDoctor extends Document {
  userId?: Types.ObjectId;
  name: string;
  specialty: string;
  department: string;
  qualification: string;
  roomNumber: string;
  avatar?: string;
  availableDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  slotDurationMinutes: number;
  status: "active" | "on_leave" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true, index: true },
    department: { type: String, required: true, trim: true, index: true },
    qualification: { type: String, default: "MD, MBBS" },
    roomNumber: { type: String, default: "Consultation Room 302" },
    avatar: { type: String },
    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    workingHours: {
      start: { type: String, default: "09:00 AM" },
      end: { type: String, default: "05:00 PM" },
    },
    slotDurationMinutes: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ["active", "on_leave", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);
