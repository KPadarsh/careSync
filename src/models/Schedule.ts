import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchedule extends Document {
  staffId?: mongoose.Types.ObjectId;
  doctorId?: mongoose.Types.ObjectId;
  personName: string;
  personType: "staff" | "doctor";
  role: string;
  department: string;
  shiftType: "morning" | "afternoon" | "evening" | "night" | "full_day" | "on_call";
  dayOfWeek:
    | "Monday"
    | "Tuesday"
    | "Wednesday"
    | "Thursday"
    | "Friday"
    | "Saturday"
    | "Sunday";
  specificDate?: Date;
  startTime: string;
  endTime: string;
  station: string;
  status: "scheduled" | "active" | "completed" | "swapped" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: "Staff" },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor" },
    personName: { type: String, required: true, trim: true },
    personType: {
      type: String,
      required: true,
      enum: ["staff", "doctor"],
      index: true,
    },
    role: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    shiftType: {
      type: String,
      required: true,
      enum: ["morning", "afternoon", "evening", "night", "full_day", "on_call"],
      default: "morning",
      index: true,
    },
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      index: true,
    },
    specificDate: { type: Date },
    startTime: { type: String, required: true, default: "08:00 AM" },
    endTime: { type: String, required: true, default: "04:00 PM" },
    station: { type: String, required: true, default: "General Station" },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "swapped", "cancelled"],
      default: "scheduled",
      index: true,
    },
    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

export const Schedule: Model<ISchedule> =
  mongoose.models.Schedule || mongoose.model<ISchedule>("Schedule", ScheduleSchema);
