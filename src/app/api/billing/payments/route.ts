import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { Payment, Invoice, Patient, Notification } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const method = searchParams.get("method");

    const query: any = {};

    if (method && method !== "all") {
      query.paymentMethod = method;
    }

    if (search) {
      const matchingPatients = await Patient.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const patientIds = matchingPatients.map((p) => p._id);

      const matchingInvoices = await Invoice.find({
        invoiceNumber: { $regex: search, $options: "i" },
      }).select("_id");
      const invoiceIds = matchingInvoices.map((inv) => inv._id);

      query.$or = [
        { transactionNumber: { $regex: search, $options: "i" } },
        { referenceNumber: { $regex: search, $options: "i" } },
        { patientId: { $in: patientIds } },
        { invoiceId: { $in: invoiceIds } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const payments = await Payment.find(query)
      .populate("patientId", "name mrn gender phone")
      .populate("invoiceId", "invoiceNumber totalAmount balanceAmount status")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      payments,
      total: payments.length,
    });
  } catch (error: any) {
    console.error("Billing payments GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payments" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireBillingSession();
    await connectToDatabase();

    const body = await req.json();
    const {
      invoiceId,
      amount,
      paymentMethod,
      referenceNumber,
      paymentDate,
      notes,
    } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice reference is required." },
        { status: 400 }
      );
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method is required." },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return NextResponse.json(
        { error: "Referenced invoice does not exist." },
        { status: 404 }
      );
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot collect payment on a cancelled invoice." },
        { status: 400 }
      );
    }

    if (payAmount > invoice.balanceAmount + 0.001) {
      return NextResponse.json(
        {
          error: `Payment amount ($${payAmount.toFixed(
            2
          )}) exceeds outstanding balance of $${invoice.balanceAmount.toFixed(
            2
          )}.`,
        },
        { status: 400 }
      );
    }

    // Auto-generate transaction number (TXN-YYYY-XXXXX)
    const count = await Payment.countDocuments();
    const transactionNumber = `TXN-${new Date().getFullYear()}-${String(
      count + 45
    ).padStart(5, "0")}`;

    const payment = await Payment.create({
      transactionNumber,
      invoiceId: invoice._id,
      patientId: invoice.patientId,
      amount: payAmount,
      paymentMethod,
      referenceNumber: referenceNumber ? String(referenceNumber).trim() : undefined,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      status: "completed",
      receivedBy: session.user._id,
      receivedByName: session.user.name || "Meera Nair, Billing Specialist",
      notes: notes ? String(notes).trim() : undefined,
    });

    // SERVER-SIDE BUSINESS LOGIC: Update Invoice Balance
    invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
    invoice.balanceAmount = Math.max(
      0,
      invoice.totalAmount - invoice.paidAmount
    );

    if (invoice.balanceAmount <= 0.001) {
      invoice.balanceAmount = 0;
      invoice.status = "paid";
    } else {
      invoice.status = "partially_paid";
    }

    await invoice.save();

    // Create confirmation notification
    await Notification.create({
      recipientId: session.user._id,
      title: `Payment Collected: $${payAmount.toFixed(2)}`,
      message: `Transaction ${transactionNumber} processed for invoice ${invoice.invoiceNumber}. New balance: $${invoice.balanceAmount.toFixed(2)}.`,
      type: "system",
      link: `/billing/invoices/${invoice._id}`,
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      message: `Payment of $${payAmount.toFixed(2)} recorded successfully.`,
      payment,
      updatedInvoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        paidAmount: invoice.paidAmount,
        balanceAmount: invoice.balanceAmount,
        status: invoice.status,
      },
    });
  } catch (error: any) {
    console.error("Billing payment POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
