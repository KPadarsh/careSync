import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { Invoice, Payment } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Invoices today
    const invoicesToday = await Invoice.find({
      date: { $gte: startOfToday, $lte: endOfToday },
    });
    const invoicesTodayCount = invoicesToday.length;
    const invoicesTodayAmount = invoicesToday.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );

    // 2. Payments today
    const paymentsToday = await Payment.find({
      paymentDate: { $gte: startOfToday, $lte: endOfToday },
      status: "completed",
    });
    const paymentsTodayCount = paymentsToday.length;
    const paymentsTodayAmount = paymentsToday.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    // 3. Outstanding balances (all unpaid or partially paid)
    const outstandingInvoices = await Invoice.find({
      status: { $in: ["pending", "partially_paid", "overdue"] },
      balanceAmount: { $gt: 0 },
    });
    const outstandingCount = outstandingInvoices.length;
    const outstandingBalancesAmount = outstandingInvoices.reduce(
      (sum, inv) => sum + (inv.balanceAmount || 0),
      0
    );

    // 4. Overdue invoices
    const overdueInvoices = await Invoice.find({
      status: "overdue",
      balanceAmount: { $gt: 0 },
    });
    const overdueCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + (inv.balanceAmount || 0),
      0
    );

    // 5. Pending payments count (invoices with status pending)
    const pendingPaymentsCount = await Invoice.countDocuments({
      status: "pending",
      balanceAmount: { $gt: 0 },
    });

    // 6. Recent Invoices
    const recentInvoices = await Invoice.find({})
      .populate("patientId", "name mrn gender phone bloodGroup")
      .populate("doctorId", "name specialty")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // 7. Recent Payments
    const recentPayments = await Payment.find({})
      .populate("patientId", "name mrn")
      .populate("invoiceId", "invoiceNumber totalAmount balanceAmount")
      .sort({ paymentDate: -1 })
      .limit(6)
      .lean();

    // 8. Recent Billing Activity Timeline (Strictly Financial, No Discharge)
    const recentInvoiceActivities = await Invoice.find({})
      .populate("patientId", "name")
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();

    const recentPaymentActivities = await Payment.find({})
      .populate("patientId", "name")
      .populate("invoiceId", "invoiceNumber")
      .sort({ paymentDate: -1 })
      .limit(4)
      .lean();

    const recentActivity = [
      ...recentPaymentActivities.map((p: any) => ({
        id: p._id.toString(),
        type: "payment",
        title: `Payment Collected: $${(p.amount || 0).toFixed(2)}`,
        description: `Txn ${p.transactionNumber} for ${(p.patientId as any)?.name || "Patient"} (${p.paymentMethod.replace("_", " ")})`,
        time: p.paymentDate || p.createdAt,
        status: p.status,
      })),
      ...recentInvoiceActivities.map((inv: any) => ({
        id: inv._id.toString(),
        type: "invoice",
        title: `Invoice Issued: ${inv.invoiceNumber}`,
        description: `Total: $${(inv.totalAmount || 0).toFixed(2)} for ${(inv.patientId as any)?.name || "Patient"} - ${inv.services?.length || 1} billable item(s)`,
        time: inv.date || inv.createdAt,
        status: inv.status,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      stats: {
        invoicesTodayCount,
        invoicesTodayAmount,
        paymentsTodayCount,
        paymentsTodayAmount,
        outstandingCount,
        outstandingBalancesAmount,
        pendingPaymentsCount,
        overdueCount,
        overdueAmount,
      },
      recentInvoices,
      recentPayments,
      recentActivity,
    });
  } catch (error: any) {
    console.error("Billing dashboard GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load billing dashboard" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
