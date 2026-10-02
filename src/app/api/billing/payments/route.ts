import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { Payment, Invoice, Patient, Notification, User } from "@/models";
import { NotificationService } from "@/services/notification.service";
import { logAuditEvent } from "@/lib/audit";

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
      const matchingUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      const matchingPatients = await Patient.find({
        $or: [
          { mrn: { $regex: search, $options: "i" } },
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
          { userId: { $in: userIds } },
        ],
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
      .populate({
        path: "patientId",
        select: "firstName lastName mrn gender phone userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("invoiceId", "invoiceNumber totalAmount balanceAmount status")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    const formatted = payments.map((pmt: any) => {
      const p = pmt.patientId;
      const patientName =
        p?.userId?.name ||
        `${p?.firstName || ""} ${p?.lastName || ""}`.trim() ||
        "Patient";
      return {
        ...pmt,
        patientId: p
          ? {
              ...p,
              name: patientName,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      payments: formatted,
      total: formatted.length,
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
      receivedByName: session.user.name || "Billing Specialist",
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

    // Create confirmation notification for billing specialist via NotificationService
    try {
      await NotificationService.createNotification({
        recipientUserId: session.user._id,
        title: `Payment Collected: $${payAmount.toFixed(2)}`,
        message: `Transaction ${transactionNumber} processed for invoice ${invoice.invoiceNumber}. New balance: $${invoice.balanceAmount.toFixed(2)}.`,
        type: "system",
        link: `/billing/invoices/${invoice._id}`,
        relatedResource: {
          resourceType: "payment",
          resourceId: payment._id.toString(),
        },
      });
    } catch (e) {
      console.error("Failed to notify billing specialist of payment:", e);
    }

    // Notify patient of payment receipt via NotificationService
    try {
      const patientDoc = await Patient.findById(invoice.patientId);
      if (patientDoc?.userId) {
        await NotificationService.createNotification({
          recipientUserId: patientDoc.userId,
          title: `Payment Received ($${payAmount.toFixed(2)})`,
          message: `Your payment of $${payAmount.toFixed(2)} for invoice ${invoice.invoiceNumber} has been received. Remaining balance: $${invoice.balanceAmount.toFixed(2)}.`,
          type: "billing",
          link: "/patient/billing",
          relatedResource: {
            resourceType: "payment",
            resourceId: payment._id.toString(),
          },
        });
      }
    } catch (notifErr) {
      console.error("Failed to notify patient of payment:", notifErr);
    }

    // Record audit event
    await logAuditEvent({
      actor: {
        userId: session.user._id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      },
      action: "PAYMENT_COLLECTED",
      resource: `Payment ${transactionNumber} for Invoice ${invoice.invoiceNumber}`,
      resourceType: "payment",
      metadata: {
        paymentId: payment._id,
        invoiceId: invoice._id,
        patientId: invoice.patientId,
        amount: payAmount,
        balanceRemaining: invoice.balanceAmount,
      },
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
