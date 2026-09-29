import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { Payment } from "@/models";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const { id } = await context.params;

    const payment = await Payment.findById(id)
      .populate("patientId", "name mrn gender phone address insurance")
      .populate("invoiceId", "invoiceNumber totalAmount paidAmount balanceAmount status services date dueDate")
      .lean();

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error: any) {
    console.error("Billing payment detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payment details" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
