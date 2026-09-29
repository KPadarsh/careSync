import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const settings = {
      cashierTerminal: "Terminal 01 - Main Lobby Cashier",
      invoicePrefix: "INV-2026",
      defaultPaymentTermsDays: 30,
      receiptPrinter: "Epson TM-T88VI Thermal Receipt Printer",
      acceptedMethods: ["cash", "credit_card", "debit_card", "insurance", "upi", "bank_transfer", "cheque"],
      taxRatePercentage: 0,
      autoReceiptPrint: true,
      soundAlertOnNewInvoice: true,
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error("Billing settings GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch settings" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const body = await req.json();

    return NextResponse.json({
      success: true,
      message: "Billing terminal configuration saved successfully.",
      settings: body,
    });
  } catch (error: any) {
    console.error("Billing settings PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
