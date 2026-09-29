import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { Invoice, Patient, Doctor } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requireBillingSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");

    const query: any = {};

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
        { "services.serviceName": { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(query)
      .populate("patientId", "name mrn gender phone bloodGroup insurance")
      .populate("doctorId", "name specialty department")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      invoices,
      total: invoices.length,
    });
  } catch (error: any) {
    console.error("Billing invoices GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch invoices" },
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
      patientId,
      doctorId,
      dueDate,
      services,
      discountAmount = 0,
      taxAmount = 0,
      notes,
    } = body;

    // Server-side validation
    if (!patientId) {
      return NextResponse.json(
        { error: "Patient reference is required." },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { error: "Referenced patient does not exist." },
        { status: 404 }
      );
    }

    if (!services || !Array.isArray(services) || services.length === 0) {
      return NextResponse.json(
        { error: "At least one billable service item is required." },
        { status: 400 }
      );
    }

    // Validate and sanitize each service line
    const sanitizedServices = services.map((s: any) => {
      const qty = Math.max(1, Number(s.quantity) || 1);
      const price = Math.max(0, Number(s.unitPrice) || 0);
      return {
        serviceName: String(s.serviceName || "Clinical Service").trim(),
        category: String(s.category || "consultation").trim(),
        quantity: qty,
        unitPrice: price,
        subtotal: qty * price,
        notes: s.notes ? String(s.notes).trim() : undefined,
      };
    });

    const calculatedSubtotal = sanitizedServices.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );

    const discount = Math.max(0, Number(discountAmount) || 0);
    const tax = Math.max(0, Number(taxAmount) || 0);
    const calculatedTotal = Math.max(0, calculatedSubtotal - discount + tax);

    // Auto-generate invoice number (INV-YYYY-XXXXX)
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
      count + 105
    ).padStart(5, "0")}`;

    const parsedDueDate = dueDate
      ? new Date(dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      invoiceNumber,
      patientId: patient._id,
      doctorId: doctorId || undefined,
      date: new Date(),
      dueDate: parsedDueDate,
      services: sanitizedServices,
      subtotalAmount: calculatedSubtotal,
      discountAmount: discount,
      taxAmount: tax,
      totalAmount: calculatedTotal,
      paidAmount: 0,
      balanceAmount: calculatedTotal,
      status: "pending",
      notes: notes ? String(notes).trim() : undefined,
      createdBy: session.user._id,
      createdByName: session.user.name || "Meera Nair, Billing Specialist",
    });

    return NextResponse.json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} created successfully.`,
      invoice,
    });
  } catch (error: any) {
    console.error("Billing invoice POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
