import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireBillingSession } from "@/lib/auth";
import { User, Payment, Invoice } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const session = await requireBillingSession();
    await connectToDatabase();

    const user = await User.findById(session.user._id).select("-passwordHash").lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalCollected = await Payment.countDocuments({
      status: "completed",
    });

    const activeInvoicesManaged = await Invoice.countDocuments({
      status: { $in: ["pending", "partially_paid"] },
    });

    return NextResponse.json({
      success: true,
      profile: {
        ...user,
        designation: "Lead Revenue & Billing Specialist",
        department: "Patient Financial Services & Revenue Cycle Management",
        badgeId: "BIL-9482-CS",
        shift: "Day Shift (08:30 AM - 05:00 PM)",
        terminal: "Counter 1 - Cashier & Billing Desk",
        stats: {
          totalCollected,
          activeInvoicesManaged,
          accuracyRate: "99.8%",
        },
      },
    });
  } catch (error: any) {
    console.error("Billing profile GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireBillingSession();
    await connectToDatabase();

    const body = await req.json();
    const { name, phone } = body;

    const user = await User.findById(session.user._id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (name) user.name = name.trim();
    if (phone) user.phone = phone.trim();

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    console.error("Billing profile PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: error.message === "UNAUTHORIZED_BILLING" ? 401 : 500 }
    );
  }
}
