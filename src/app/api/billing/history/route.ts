import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { Payment, Patient, Invoice, User } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const range = searchParams.get("range"); // "today" | "week" | "month" | "all"
    const method = searchParams.get("method");

    const query: any = {};

    if (method && method !== "all") {
      query.paymentMethod = method;
    }

    if (range === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      query.paymentDate = { $gte: start };
    } else if (range === "week") {
      const start = new Date(Date.now() - 7 * 24 * 3600 * 1000);
      query.paymentDate = { $gte: start };
    } else if (range === "month") {
      const start = new Date(Date.now() - 30 * 24 * 3600 * 1000);
      query.paymentDate = { $gte: start };
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
      const invoiceIds = matchingInvoices.map((i) => i._id);

      query.$or = [
        { transactionNumber: { $regex: search, $options: "i" } },
        { referenceNumber: { $regex: search, $options: "i" } },
        { patientId: { $in: patientIds } },
        { invoiceId: { $in: invoiceIds } },
        { receivedByName: { $regex: search, $options: "i" } },
      ];
    }

    const payments = await Payment.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn gender phone userId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("invoiceId", "invoiceNumber totalAmount balanceAmount status services")
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

    const totalCollected = formatted.reduce((sum, p) => sum + (p.amount || 0), 0);

    return NextResponse.json({
      success: true,
      payments: formatted,
      stats: {
        totalTransactions: formatted.length,
        totalCollected,
      },
    });
  } catch (error: any) {
    console.error("Billing history GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment history" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
