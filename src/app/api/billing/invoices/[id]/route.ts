import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { Invoice, Payment } from "@/models";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const { id } = await context.params;

    const invoice = await Invoice.findById(id)
      .populate("patientId", "name mrn gender dateOfBirth phone address insurance bloodGroup")
      .populate("doctorId", "name specialty department qualification")
      .lean();

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Retrieve full payment history for this invoice
    const payments = await Payment.find({ invoiceId: invoice._id })
      .sort({ paymentDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      invoice,
      payments,
    });
  } catch (error: any) {
    console.error("Billing invoice detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoice details" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const { id } = await context.params;
    const body = await req.json();

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const { action, notes, dueDate, discountAmount } = body;

    if (action === "cancel") {
      if (invoice.paidAmount > 0) {
        return NextResponse.json(
          {
            error:
              "Cannot cancel an invoice with recorded payments. Please refund or reconcile payments first.",
          },
          { status: 400 }
        );
      }
      invoice.status = "cancelled";
      await invoice.save();
      return NextResponse.json({
        success: true,
        message: `Invoice ${invoice.invoiceNumber} has been cancelled.`,
        invoice,
      });
    }

    if (notes !== undefined) invoice.notes = String(notes).trim();
    if (dueDate !== undefined) invoice.dueDate = new Date(dueDate);
    if (discountAmount !== undefined) {
      invoice.discountAmount = Math.max(0, Number(discountAmount) || 0);
    }

    await invoice.save();

    return NextResponse.json({
      success: true,
      message: "Invoice updated successfully.",
      invoice,
    });
  } catch (error: any) {
    console.error("Billing invoice detail PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update invoice" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
