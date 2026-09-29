import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "insurance"
  | "bank_transfer"
  | "upi"
  | "cheque";

export type PaymentStatus = "completed" | "pending" | "refunded" | "failed";

export interface IPayment extends Document {
  transactionNumber: string; // e.g. "TXN-2026-00042"
  invoiceId: Types.ObjectId;
  patientId: Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string; // Authorization code, check number, UPI ref
  paymentDate: Date;
  status: PaymentStatus;
  receivedBy?: Types.ObjectId;
  receivedByName: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      enum: [
        "cash",
        "credit_card",
        "debit_card",
        "insurance",
        "bank_transfer",
        "upi",
        "cheque",
      ],
      default: "credit_card",
      required: true,
      index: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["completed", "pending", "refunded", "failed"],
      default: "completed",
      index: true,
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    receivedByName: {
      type: String,
      required: true,
      default: "Meera Nair, Billing Specialist",
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
