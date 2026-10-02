import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IDoctor extends Document {
  userId?: Types.ObjectId;
  doctorId: string;
  name: string;
  firstName?: string;
  lastName?: string;
  specialization: string;
  specialty: string; // Non-optional for report indexing
  departmentId?: Types.ObjectId;
  department: string;
  licenseNumber: string;
  phone?: string;
  email?: string;
  consultationFee: number;
  qualification: string;
  roomNumber: string;
  avatar?: string;
  availableDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  slotDurationMinutes: number;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "active" | "inactive" | "on_leave";
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    doctorId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: IDoctor) {
        return `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Doctor",
    },
    firstName: {
      type: String,
      trim: true,
      default: function (this: IDoctor) {
        return this.name?.replace(/^Dr\.\s*/i, "").split(" ")[0] || "Doctor";
      },
    },
    lastName: {
      type: String,
      trim: true,
      default: function (this: IDoctor) {
        const parts = this.name?.replace(/^Dr\.\s*/i, "").split(" ") || [];
        return parts.slice(1).join(" ") || "Physician";
      },
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      default: "General Medicine",
      index: true,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
      default: "General Medicine",
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
      default: "General Medicine",
      index: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
      default: function (this: IDoctor) {
        return `LIC-${this.doctorId || Math.floor(1000 + Math.random() * 9000)}`;
      },
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    consultationFee: {
      type: Number,
      default: 500,
      min: 0,
    },
    qualification: {
      type: String,
      default: "MD, MBBS",
    },
    roomNumber: {
      type: String,
      default: "Consultation Room 101",
    },
    avatar: {
      type: String,
    },
    availableDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    workingHours: {
      start: { type: String, default: "09:00 AM" },
      end: { type: String, default: "05:00 PM" },
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ON_LEAVE", "active", "inactive", "on_leave"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

DoctorSchema.pre<IDoctor>("save", function () {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = `Dr. ${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
  if (!this.specialty && this.specialization) {
    this.specialty = this.specialization;
  }
  if (!this.specialization && this.specialty) {
    this.specialization = this.specialty;
  }
});

DoctorSchema.index({ departmentId: 1, status: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models?.Doctor) {
  delete (mongoose.models as any).Doctor;
}

export const Doctor: Model<IDoctor> =
  mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);
