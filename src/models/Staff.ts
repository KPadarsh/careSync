import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IStaff extends Document {
  userId?: Types.ObjectId;
  employeeId: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId?: Types.ObjectId;
  department: string; // Non-optional for report aggregations
  designation: string;
  role: string; // Non-optional for report aggregations
  shift: string; // Non-optional for report aggregations
  joiningDate?: Date;
  joinedDate?: Date;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "active" | "inactive" | "on_leave";
  emergencyContact?: string;
  qualifications?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: function (this: IStaff) {
        return this.fullName?.split(" ")[0] || "Staff";
      },
    },
    lastName: {
      type: String,
      trim: true,
      default: function (this: IStaff) {
        const parts = this.fullName?.split(" ") || [];
        return parts.slice(1).join(" ") || "Member";
      },
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
    department: {
      type: String,
      required: true,
      default: "General Medicine",
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
      default: "Staff Specialist",
    },
    role: {
      type: String,
      required: true,
      default: "staff",
      trim: true,
      index: true,
    },
    shift: {
      type: String,
      default: "Morning (08:00 - 16:00)",
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ON_LEAVE", "active", "inactive", "on_leave"],
      default: "ACTIVE",
      index: true,
    },
    emergencyContact: {
      type: String,
      default: "",
    },
    qualifications: {
      type: String,
      default: "",
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

// Virtual / pre-save to keep firstName, lastName, and fullName in sync
StaffSchema.pre<IStaff>("save", function () {
  if (!this.fullName && (this.firstName || this.lastName)) {
    this.fullName = `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
  if (!this.firstName && this.fullName) {
    this.firstName = this.fullName.split(" ")[0] || "Staff";
  }
  if (!this.lastName && this.fullName) {
    const parts = this.fullName.split(" ");
    this.lastName = parts.slice(1).join(" ") || "Member";
  }
  if (!this.joiningDate && this.joinedDate) {
    this.joiningDate = this.joinedDate;
  }
  if (!this.joinedDate && this.joiningDate) {
    this.joinedDate = this.joiningDate;
  }
});

StaffSchema.index({ departmentId: 1, status: 1 });

if (process.env.NODE_ENV !== "production" && mongoose.models?.Staff) {
  delete (mongoose.models as any).Staff;
}

export const Staff: Model<IStaff> =
  mongoose.models.Staff || mongoose.model<IStaff>("Staff", StaffSchema);
