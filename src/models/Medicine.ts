import mongoose, { Schema, Document, Model } from "mongoose";

export type MedicineStatus = "in_stock" | "low_stock" | "out_of_stock";

export interface IMedicine extends Document {
  name: string;
  genericName?: string;
  category: string;
  availableQuantity: number;
  unit: string; // e.g., "tablets", "capsules", "bottles", "vials", "ampoules", "tubes"
  lowStockThreshold: number;
  status: MedicineStatus;
  unitPrice?: number;
  location?: string; // Shelf / Rack identifier, e.g. "Rack A-3"
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    name: { type: String, required: true, trim: true, index: true },
    genericName: { type: String, trim: true },
    category: { type: String, required: true, default: "General", trim: true },
    availableQuantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, required: true, default: "tablets", trim: true },
    lowStockThreshold: { type: Number, required: true, min: 1, default: 20 },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
      index: true,
    },
    unitPrice: { type: Number, min: 0, default: 0 },
    location: { type: String, default: "Main Shelf", trim: true },
    description: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate status automatically from availableQuantity and threshold
MedicineSchema.pre<IMedicine>("save", function () {
  if (this.availableQuantity <= 0) {
    this.status = "out_of_stock";
  } else if (this.availableQuantity <= this.lowStockThreshold) {
    this.status = "low_stock";
  } else {
    this.status = "in_stock";
  }
});

export const Medicine: Model<IMedicine> =
  mongoose.models.Medicine || mongoose.model<IMedicine>("Medicine", MedicineSchema);
