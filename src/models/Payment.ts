import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PaymentMethod =
  | "cash"
  | "credit_card"
  | "debit_card"
  | "insurance"
  | "bank_transfer"
  | "upi"
  | "cheque"
  | "CASH"
  | "CARD"
  | "UPI"
  | "INSURANCE"
  | "BANK_TRANSFER";

export type PaymentStatus =
  | "COMPLETED"
  | "PENDING"
  | "REFUNDED"
  | "FAILED"
  | "completed"
  | "pending"
  | "refunded"
  | "failed";

export interface IPayment extends Document {
  paymentId: string;
  transactionNumber?: string; // Backwards compatibility
  invoiceId: Types.ObjectId;
  patientId: Types.ObjectId;
  encounterId?: Types.ObjectId;
  amount: number;
  method: PaymentMethod;
  paymentMethod?: PaymentMethod; // Backwards compatibility
  transactionReference?: string;
  referenceNumber?: string; // Backwards compatibility
  status: PaymentStatus;
  paidAt: Date;
  paymentDate?: Date; // Backwards compatibility
  recordedBy?: Types.ObjectId;
  receivedBy?: Types.ObjectId; // Backwards compatibility
  receivedByName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: IPayment) {
        return `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    transactionNumber: {
      type: String,
      trim: true,
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
    encounterId: {
      type: Schema.Types.ObjectId,
      ref: "Encounter",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    method: {
      type: String,
      required: true,
      default: "cash",
      index: true,
    },
    paymentMethod: {
      type: String,
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "COMPLETED",
        "PENDING",
        "REFUNDED",
        "FAILED",
        "completed",
        "pending",
        "refunded",
        "failed",
      ],
      default: "COMPLETED",
      index: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paymentDate: {
      type: Date,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    receivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    receivedByName: {
      type: String,
      default: "Billing Staff",
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

// Pre-save synchronization hook
PaymentSchema.pre<IPayment>("save", function () {
  if (!this.transactionNumber && this.paymentId) {
    this.transactionNumber = this.paymentId;
  }
  if (!this.paymentId && this.transactionNumber) {
    this.paymentId = this.transactionNumber;
  }
  if (!this.method && this.paymentMethod) {
    this.method = this.paymentMethod;
  }
  if (!this.paymentMethod && this.method) {
    this.paymentMethod = this.method;
  }
  if (!this.transactionReference && this.referenceNumber) {
    this.transactionReference = this.referenceNumber;
  }
  if (!this.referenceNumber && this.transactionReference) {
    this.referenceNumber = this.transactionReference;
  }
  if (!this.paidAt && this.paymentDate) {
    this.paidAt = this.paymentDate;
  }
  if (!this.paymentDate && this.paidAt) {
    this.paymentDate = this.paidAt;
  }
  if (!this.recordedBy && this.receivedBy) {
    this.recordedBy = this.receivedBy;
  }
  if (!this.receivedBy && this.recordedBy) {
    this.receivedBy = this.recordedBy;
  }
});

PaymentSchema.index({ patientId: 1, paidAt: -1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
