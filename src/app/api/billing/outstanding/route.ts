import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { Invoice, Patient } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");

    const query: any = {
      balanceAmount: { $gt: 0 },
      status: { $in: ["pending", "partially_paid", "overdue"] },
    };

    if (status && status !== "all") {
      query.status = status;
    }

    if (search) {
      const matchingPatients = await Patient.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");
      const patientIds = matchingPatients.map((p) => p._id);

      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { patientId: { $in: patientIds } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(query)
      .populate("patientId", "name mrn gender phone insurance")
      .populate("doctorId", "name specialty")
      .sort({ dueDate: 1, balanceAmount: -1 })
      .lean();

    // Summary & Aging Breakdown
    const now = new Date();
    let totalOutstanding = 0;
    let currentAmount = 0;
    let overdue30Amount = 0;
    let overdue60Amount = 0;
    let overdue90Amount = 0;

    let unpaidCount = 0;
    let partiallyPaidCount = 0;
    let overdueCount = 0;

    invoices.forEach((inv) => {
      const bal = inv.balanceAmount || 0;
      totalOutstanding += bal;

      if (inv.status === "pending") unpaidCount++;
      else if (inv.status === "partially_paid") partiallyPaidCount++;
      else if (inv.status === "overdue") overdueCount++;

      const due = new Date(inv.dueDate);
      const diffDays = Math.floor(
        (now.getTime() - due.getTime()) / (1000 * 3600 * 24)
      );

      if (diffDays <= 0) {
        currentAmount += bal;
      } else if (diffDays <= 30) {
        overdue30Amount += bal;
      } else if (diffDays <= 60) {
        overdue60Amount += bal;
      } else {
        overdue90Amount += bal;
      }
    });

    return NextResponse.json({
      success: true,
      invoices,
      summary: {
        totalOutstanding,
        totalInvoices: invoices.length,
        unpaidCount,
        partiallyPaidCount,
        overdueCount,
        aging: {
          current: currentAmount,
          overdue1To30: overdue30Amount,
          overdue31To60: overdue60Amount,
          overdue60Plus: overdue90Amount,
        },
      },
    });
  } catch (error: any) {
    console.error("Billing outstanding GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch outstanding invoices" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
