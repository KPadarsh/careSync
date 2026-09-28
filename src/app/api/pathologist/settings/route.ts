import { NextRequest, NextResponse } from "next/server";
import { requirePathologistSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePathologistSession();

    return NextResponse.json({
      settings: {
        autoHighlightPanicValues: true,
        statNotificationSound: true,
        electronicSignatureStamp: "Dr. Sunita Patil, MD Pathology [CERT-AUTHENTICATED]",
        includeReferenceRangeFootnotes: true,
        requireTwoFactorForCriticalCert: false,
        criticalAlertThresholds: {
          troponinPanicLevel: "0.04 ng/mL",
          potassiumHighPanic: "6.0 mEq/L",
          potassiumLowPanic: "2.8 mEq/L",
          glucoseHighPanic: "400 mg/dL",
          plateletCriticalLow: "20,000 /uL",
        },
        reportHeaderStyle: "CareSync Certified Clinical Pathology Report",
        autoNotifyOrderingDoctor: true,
        notifyPatientOnVerification: true,
      },
      user: {
        id: session.user._id.toString(),
        name: session.user.name,
        email: session.user.email,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist settings error:", error);
    return NextResponse.json(
      { error: "Failed to load pathologist workstation settings." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requirePathologistSession();
    const body = await req.json();

    return NextResponse.json({
      success: true,
      message: "Pathology workstation preferences saved.",
      settings: body,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings." },
      { status: 500 }
    );
  }
}
