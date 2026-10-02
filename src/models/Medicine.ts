import mongoose, { Schema, Document, Model } from "mongoose";

export type MedicineStatus =
  | "AVAILABLE"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

export interface IMedicine extends Document {
  medicineId: string;
  name: string;
  genericName?: string;
  unit: string;
  availableQuantity: number;
  lowStockThreshold: number;
  category?: string;
  unitPrice?: number;
  location?: string;
  status: MedicineStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    medicineId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: IMedicine) {
        return `MED-${Math.floor(1000 + Math.random() * 9000)}`;
      },
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      default: "tablets",
      trim: true,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: 1,
      default: 20,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    unitPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      type: String,
      default: "Main Dispensary Shelf",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "LOW_STOCK",
        "OUT_OF_STOCK",
        "in_stock",
        "low_stock",
        "out_of_stock",
      ],
      default: "AVAILABLE",
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate status automatically from availableQuantity and threshold
MedicineSchema.pre<IMedicine>("save", function () {
  if (this.availableQuantity <= 0) {
    this.status = this.status === "out_of_stock" ? "out_of_stock" : "OUT_OF_STOCK";
  } else if (this.availableQuantity <= this.lowStockThreshold) {
    this.status = this.status === "low_stock" ? "low_stock" : "LOW_STOCK";
  } else {
    this.status = this.status === "in_stock" ? "in_stock" : "AVAILABLE";
  }
});

export const Medicine: Model<IMedicine> =
  mongoose.models.Medicine || mongoose.model<IMedicine>("Medicine", MedicineSchema);
