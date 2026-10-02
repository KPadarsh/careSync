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

    const getPatientName = (patient: any) => {
      if (!patient) return "Patient";
      if (patient.userId && typeof patient.userId === "object" && patient.userId.name) {
        return patient.userId.name;
      }
      if (patient.firstName || patient.lastName) {
        return `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
      }
      return patient.name || "Patient";
    };

    // 6. Recent Invoices
    const rawRecentInvoices = await Invoice.find({})
      .populate({
        path: "patientId",
        select: "firstName lastName mrn gender phone bloodGroup userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const recentInvoices = rawRecentInvoices.map((inv: any) => {
      if (inv.patientId) {
        inv.patientId.name = getPatientName(inv.patientId);
      }
      return inv;
    });

    // 7. Recent Payments
    const rawRecentPayments = await Payment.find({})
      .populate({
        path: "patientId",
        select: "firstName lastName mrn gender phone bloodGroup userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("invoiceId", "invoiceNumber totalAmount balanceAmount")
      .sort({ paymentDate: -1 })
      .limit(6)
      .lean();

    const recentPayments = rawRecentPayments.map((p: any) => {
      if (p.patientId) {
        p.patientId.name = getPatientName(p.patientId);
      }
      return p;
    });

    // 8. Recent Billing Activity Timeline (Strictly Financial, No Discharge)
    const recentActivity = [
      ...recentPayments.map((p: any) => ({
        id: p._id.toString(),
        type: "payment",
        title: `Payment Collected: $${(p.amount || 0).toFixed(2)}`,
        description: `Txn ${p.transactionNumber} for ${getPatientName(p.patientId)} (${(p.paymentMethod || "").replace("_", " ")})`,
        time: p.paymentDate || p.createdAt,
        status: p.status,
      })),
      ...recentInvoices.map((inv: any) => ({
        id: inv._id.toString(),
        type: "invoice",
        title: `Invoice Issued: ${inv.invoiceNumber}`,
        description: `Total: $${(inv.totalAmount || 0).toFixed(2)} for ${getPatientName(inv.patientId)} - ${inv.services?.length || 1} billable item(s)`,
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
