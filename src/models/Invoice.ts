import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IInvoiceServiceItem {
  serviceName: string;
  category: string; // "consultation" | "laboratory" | "pharmacy" | "radiology" | "nursing" | "procedure" | "room" | "other"
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "pending"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export interface IInvoice extends Document {
  invoiceNumber: string; // e.g. "INV-2026-00101"
  patientId: Types.ObjectId;
  doctorId?: Types.ObjectId;
  date: Date;
  dueDate: Date;
  services: IInvoiceServiceItem[];
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  notes?: string;
  createdBy?: Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceServiceItemSchema = new Schema<IInvoiceServiceItem>(
  {
    serviceName: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      default: "consultation",
      trim: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
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
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: true,
    },
    services: {
      type: [InvoiceServiceItemSchema],
      required: true,
      validate: {
        validator: (v: IInvoiceServiceItem[]) => v.length > 0,
        message: "An invoice must contain at least one billable service.",
      },
    },
    subtotalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "draft",
        "issued",
        "pending",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByName: {
      type: String,
      required: true,
      default: "Meera Nair, Billing Specialist",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate subtotal, total, and balance amounts reliably
InvoiceSchema.pre<IInvoice>("save", function () {
  const calculatedSubtotal = this.services.reduce(
    (acc, curr) => acc + (curr.quantity * curr.unitPrice),
    0
  );
  this.subtotalAmount = calculatedSubtotal;
  this.totalAmount = Math.max(
    0,
    calculatedSubtotal - (this.discountAmount || 0) + (this.taxAmount || 0)
  );
  this.balanceAmount = Math.max(0, this.totalAmount - (this.paidAmount || 0));

  if (this.status !== "cancelled" && this.status !== "draft") {
    if (this.balanceAmount === 0 && this.totalAmount > 0) {
      this.status = "paid";
    } else if (this.paidAmount > 0 && this.balanceAmount > 0) {
      this.status = "partially_paid";
    } else if (this.dueDate && new Date() > this.dueDate && this.balanceAmount > 0) {
      this.status = "overdue";
    } else if (this.paidAmount === 0) {
      this.status = "pending";
    }
  }
});

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
