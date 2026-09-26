import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user._id.toString(),
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        phone: session.user.phone,
        avatar: session.user.avatar,
      },
      patient: session.patient
        ? {
            id: session.patient._id.toString(),
            mrn: session.patient.mrn,
            bloodGroup: session.patient.bloodGroup,
            gender: session.patient.gender,
            phone: session.patient.phone,
            allergies: session.patient.allergies,
            address: session.patient.address,
            emergencyContact: session.patient.emergencyContact,
            insurance: session.patient.insurance,
          }
        : null,
      role: session.role,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
