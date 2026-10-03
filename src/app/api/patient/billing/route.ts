import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { Invoice, Payment, Notification } from "@/models";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    await connectToDatabase();
    const { user, patient, patientId } = await requirePatientSession();

    // 1. Fetch patient's invoices
    const rawInvoices = await Invoice.find({ patientId })
      .populate("doctorId", "name specialty department")
      .sort({ date: -1 })
      .lean();

    // 2. Fetch patient's payments
    const rawPayments = await Payment.find({ patientId })
      .populate("invoiceId", "invoiceNumber")
      .sort({ paymentDate: -1 })
      .lean();

    // Calculate totals
    const totalOutstanding = rawInvoices.reduce((sum, inv) => {
      const st = (inv.status || "").toUpperCase();
      if (st !== "PAID" && st !== "CANCELLED") {
        return sum + (inv.balanceAmount || 0);
      }
      return sum;
    }, 0);

    const totalPaid = rawPayments.reduce((sum, p) => {
      if (p.status === "completed") {
        return sum + (p.amount || 0);
      }
      return sum;
    }, 0);

    const invoices = rawInvoices.map((inv: any) => {
      const st = (inv.status || "").toUpperCase();
      const displayStatus =
        st === "PAID"
          ? "Paid"
          : st === "UNPAID" || st === "PENDING" || st === "PARTIALLY_PAID" || st === "OVERDUE"
          ? "Unpaid"
          : inv.status;

      return {
        id: inv.invoiceNumber,
        invoiceDbId: inv._id.toString(),
        service:
          inv.services?.map((s: any) => s.serviceName).join(", ") ||
          "General Medical Services",
        provider: inv.doctorId?.name || "Attending Physician",
        date: new Date(inv.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        rawDate: inv.date,
        totalBilled: `$${(inv.totalAmount || 0).toFixed(2)}`,
        insuranceCovered: `$${(inv.discountAmount || 0).toFixed(2)}`,
        patientOwing: `$${(inv.balanceAmount || 0).toFixed(2)}`,
        status: displayStatus,
        rawStatus: inv.status,
        totalAmountNum: inv.totalAmount || 0,
        balanceAmountNum: inv.balanceAmount || 0,
      };
    });

    const payments = rawPayments.map((p: any) => ({
      id: p.transactionNumber,
      paymentDbId: p._id.toString(),
      invoiceNumber: p.invoiceId?.invoiceNumber || "N/A",
      amount: `$${(p.amount || 0).toFixed(2)}`,
      method: (p.paymentMethod || "").replace("_", " "),
      date: new Date(p.paymentDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: p.status,
    }));

    return NextResponse.json({
      success: true,
      invoices,
      payments,
      totalOutstanding,
      totalPaid,
      insurance: patient.insurance || {
        provider: "Self-Pay / Primary",
        policyNumber: "N/A",
      },
    });
  } catch (error: any) {
    console.error("Patient billing GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch billing statements" },
      { status: error.message === "UNAUTHORIZED_PATIENT" ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user, patient, patientId } = await requirePatientSession();

    const body = await req.json();
    const { invoiceId, payFullBalance, paymentMethod = "credit_card" } = body;

    if (payFullBalance) {
      // Find all unpaid invoices
      const unpaidInvoices: any[] = await Invoice.find({
        patientId: patientId as any,
        status: {
          $in: [
            "pending",
            "partially_paid",
            "overdue",
            "UNPAID",
            "PARTIALLY_PAID",
          ],
        },
        balanceAmount: { $gt: 0 },
      });

      if (unpaidInvoices.length === 0) {
        return NextResponse.json(
          { error: "No outstanding invoices to pay." },
          { status: 400 }
        );
      }

      const paymentCount = await Payment.countDocuments();
      let createdPayments = [];

      for (let i = 0; i < unpaidInvoices.length; i++) {
        const inv = unpaidInvoices[i];
        const payAmount = inv.balanceAmount;

        const txnNumber = `TXN-${new Date().getFullYear()}-${String(
          paymentCount + i + 100
        ).padStart(5, "0")}`;

        const payment = await Payment.create({
          transactionNumber: txnNumber,
          invoiceId: inv._id,
          patientId,
          amount: payAmount,
          paymentMethod,
          referenceNumber: `CARD-${Math.floor(1000 + Math.random() * 9000)}`,
          paymentDate: new Date(),
          status: "completed",
          receivedByName: "Online Patient Portal",
          notes: "Settled via patient self-service portal.",
        });

        inv.paidAmount = (inv.paidAmount || 0) + payAmount;
        inv.balanceAmount = 0;
        inv.status = "paid";
        await inv.save();

        await logAuditEvent({
          actor: {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: "patient",
          },
          action: "PAYMENT_RECEIVED",
          resource: `Payment of $${payAmount.toFixed(2)} for Invoice ${inv.invoiceNumber}`,
          resourceType: "payment",
          metadata: {
            invoiceId: inv._id.toString(),
            invoiceNumber: inv.invoiceNumber,
            amount: payAmount,
            paymentMethod,
            method: "online_patient_portal",
          },
        });

        createdPayments.push(payment);
      }

      // Notify patient
      await Notification.create({
        recipientId: user._id,
        title: "Payment Received",
        message: `Your balance of all outstanding invoices has been settled in full. Thank you!`,
        type: "billing",
        link: "/patient/dashboard",
        isRead: false,
      });

      return NextResponse.json({
        success: true,
        message: "All outstanding balances successfully paid.",
        paymentsCount: createdPayments.length,
      });
    }

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId or payFullBalance is required." },
        { status: 400 }
      );
    }

    // Find specific invoice
    const invoice = await Invoice.findOne({
      $or: [{ _id: invoiceId }, { invoiceNumber: invoiceId }],
      patientId,
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found or does not belong to you." },
        { status: 404 }
      );
    }

    if (invoice.balanceAmount <= 0 || invoice.status === "paid" || invoice.status === "PAID") {
      return NextResponse.json(
        { error: "This invoice is already fully paid." },
        { status: 400 }
      );
    }

    const payAmount = body.amount
      ? Math.min(Number(body.amount), invoice.balanceAmount)
      : invoice.balanceAmount;

    const paymentCount = await Payment.countDocuments();
    const txnNumber = `TXN-${new Date().getFullYear()}-${String(
      paymentCount + 100
    ).padStart(5, "0")}`;

    const payment = await Payment.create({
      transactionNumber: txnNumber,
      invoiceId: invoice._id,
      patientId,
      amount: payAmount,
      paymentMethod,
      referenceNumber: `CARD-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentDate: new Date(),
      status: "completed",
      receivedByName: "Online Patient Portal",
      notes: "Settled via patient self-service portal.",
    });

    invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
    invoice.balanceAmount = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    if (invoice.balanceAmount === 0) {
      invoice.status = "paid";
    } else {
      invoice.status = "partially_paid";
    }
    await invoice.save();

    await logAuditEvent({
      actor: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: "patient",
      },
      action: "PAYMENT_RECEIVED",
      resource: `Payment of $${payAmount.toFixed(2)} for Invoice ${invoice.invoiceNumber}`,
      resourceType: "payment",
      metadata: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        amount: payAmount,
        paymentMethod,
        method: "online_patient_portal",
      },
    });

    // Notify patient
    await Notification.create({
      recipientId: user._id,
      title: "Payment Received",
      message: `Your payment of $${payAmount.toFixed(2)} for invoice ${
        invoice.invoiceNumber
      } was processed successfully.`,
      type: "billing",
      link: "/patient/dashboard",
      isRead: false,
    });

    return NextResponse.json({
      success: true,
      message: "Payment processed successfully.",
      transactionNumber: payment.transactionNumber,
      paidAmount: payAmount,
      remainingBalance: invoice.balanceAmount,
      status: invoice.status,
    });
  } catch (error: any) {
    console.error("Patient billing POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment" },
      { status: error.message === "UNAUTHORIZED_PATIENT" ? 401 : 500 }
    );
  }
}
