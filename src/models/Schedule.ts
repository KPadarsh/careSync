import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISchedule extends Document {
  userId?: Types.ObjectId;
  doctorId?: Types.ObjectId;
  staffId?: Types.ObjectId;
  personName?: string;
  personType?: "staff" | "doctor";
  role?: string;
  department?: string;
  shiftType: "morning" | "afternoon" | "evening" | "night" | "full_day" | "on_call" | string;
  dayOfWeek:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday"
    | string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  specificDate?: Date;
  station?: string;
  status?: "scheduled" | "active" | "completed" | "swapped" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      index: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "Staff",
      index: true,
    },
    personName: {
      type: String,
      trim: true,
    },
    personType: {
      type: String,
      enum: ["staff", "doctor"],
      index: true,
    },
    role: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
      index: true,
    },
    shiftType: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night", "full_day", "on_call"],
      default: "morning",
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      default: "09:00 AM",
    },
    endTime: {
      type: String,
      required: true,
      default: "05:00 PM",
    },
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    specificDate: {
      type: Date,
    },
    station: {
      type: String,
      default: "General Station",
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "swapped", "cancelled"],
      default: "scheduled",
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

ScheduleSchema.index({ doctorId: 1, dayOfWeek: 1, isAvailable: 1 });
ScheduleSchema.index({ userId: 1, isAvailable: 1 });

export const Schedule: Model<ISchedule> =
  mongoose.models.Schedule ||
  mongoose.model<ISchedule>("Schedule", ScheduleSchema);
