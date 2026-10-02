import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IInvoiceItem {
  serviceName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export type InvoiceStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED"
  | "draft"
  | "issued"
  | "pending"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled";

export interface IInvoice extends Document {
  invoiceId: string;
  invoiceNumber?: string;
  patientId: Types.ObjectId;
  encounterId?: Types.ObjectId;
  doctorId?: Types.ObjectId;
  items: IInvoiceItem[];
  services: IInvoiceItem[]; // Kept non-optional for existing billing API routes
  subtotal: number;
  subtotalAmount?: number;
  discount: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  totalAmount: number; // Kept non-optional for existing billing API routes
  paidAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  date?: Date;
  dueDate: Date; // Kept non-optional for existing billing API routes
  notes?: string;
  createdBy?: Types.ObjectId;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
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
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      default: function (this: IInvoice) {
        return `INV-${Math.floor(10000 + Math.random() * 90000)}`;
      },
    },
    invoiceNumber: {
      type: String,
      trim: true,
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
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "Doctor",
      index: true,
    },
    items: {
      type: [InvoiceItemSchema],
      required: true,
      default: [],
    },
    services: {
      type: [InvoiceItemSchema],
      required: true,
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    subtotalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "UNPAID",
        "PARTIALLY_PAID",
        "PAID",
        "CANCELLED",
        "draft",
        "issued",
        "pending",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      default: "UNPAID",
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      index: true,
    },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByName: {
      type: String,
      default: "Billing Specialist",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

InvoiceSchema.pre<IInvoice>("save", function () {
  if (!this.invoiceNumber && this.invoiceId) {
    this.invoiceNumber = this.invoiceId;
  }
  if (!this.invoiceId && this.invoiceNumber) {
    this.invoiceId = this.invoiceNumber;
  }

  // Sync items and services
  if ((!this.items || this.items.length === 0) && this.services && this.services.length > 0) {
    this.items = [...this.services];
  } else if ((!this.services || this.services.length === 0) && this.items && this.items.length > 0) {
    this.services = [...this.items];
  }

  const calculatedSubtotal = (this.items || []).reduce(
    (acc, curr) => acc + curr.quantity * curr.unitPrice,
    0
  );
  this.subtotal = calculatedSubtotal;
  this.subtotalAmount = calculatedSubtotal;

  const disc = this.discount ?? this.discountAmount ?? 0;
  this.discount = disc;
  this.discountAmount = disc;

  const tax = this.taxAmount || 0;
  const tot = Math.max(0, calculatedSubtotal - disc + tax);
  this.total = tot;
  this.totalAmount = tot;

  this.balanceAmount = Math.max(0, tot - (this.paidAmount || 0));

  if (this.status !== "CANCELLED" && this.status !== "cancelled" && this.status !== "draft") {
    if (this.balanceAmount === 0 && this.total > 0) {
      this.status = "PAID";
    } else if (this.paidAmount > 0 && this.balanceAmount > 0) {
      this.status = "PARTIALLY_PAID";
    } else if (this.paidAmount === 0) {
      this.status = "UNPAID";
    }
  }
});

InvoiceSchema.index({ patientId: 1, date: -1 });

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
