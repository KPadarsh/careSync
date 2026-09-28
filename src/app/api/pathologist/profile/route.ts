import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePathologistSession } from "@/lib/auth";
import { User, LabReport } from "@/models";

export async function GET(req: NextRequest) {
  try {
    const session = await requirePathologistSession();
    await connectToDatabase();

    const verifiedCount = await LabReport.countDocuments({
      status: { $in: ["verified", "finalized"] },
    });

    const pendingCount = await LabReport.countDocuments({
      status: { $in: ["submitted_for_review", "under_review"] },
    });

    return NextResponse.json({
      profile: {
        id: session.user._id.toString(),
        name: session.user.name,
        email: session.user.email,
        phone: session.user.phone || "+1 (555) 019-7721",
        avatar: session.user.avatar,
        title: "Medical Director, Pathology & Clinical Laboratory Services",
        qualifications: "MD, FCAP, FASCP",
        medicalLicense: "MED-PATH-884920-CA",
        boardCertifications: [
          "American Board of Pathology: Anatomic Pathology & Clinical Pathology (AP/CP)",
          "Subspecialty Qualification: Chemical Pathology & Hematopathology",
        ],
        facility: "CareSync Central Hospital Laboratory",
        departmentsSupervised: [
          "Clinical Chemistry",
          "Hematology & Coagulation",
          "Clinical Endocrinology & Immunoassay",
          "Diagnostic Microbiology",
        ],
        workstation: "Pathology Station Alpha / High-Resolution Digital Microscopy",
        totalVerifiedReports: verifiedCount,
        activeReviewQueue: pendingCount,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist profile error:", error);
    return NextResponse.json(
      { error: "Failed to load pathologist profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requirePathologistSession();
    await connectToDatabase();

    const body = await req.json();
    const updates: any = {};
    if (body.name) updates.name = body.name.trim();
    if (body.phone) updates.phone = body.phone.trim();

    const updatedUser = await User.findByIdAndUpdate(
      session.user._id,
      { $set: updates },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Pathologist credentials updated.",
      user: {
        id: updatedUser?._id.toString(),
        name: updatedUser?.name,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
      },
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
