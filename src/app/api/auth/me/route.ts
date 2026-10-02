import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";
import { Patient } from "@/models/Patient";
import { connectToDatabase } from "@/lib/db";

/**
 * GET /api/auth/me
 * Ultra-fast endpoint returning current authenticated safe user.
 * Rejects unauthenticated, inactive, or expired sessions with 401.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await AuthService.getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { authenticated: false, error: "Unauthenticated or inactive account" },
        { status: 401 }
      );
    }

    // Resolve patient details only if role is patient
    let patientData = null;
    const roleNorm = (user.role || "").toUpperCase();
    if (roleNorm === "PATIENT") {
      await connectToDatabase();
      const patient = await Patient.findOne({ userId: user.id }).lean();
      if (patient) {
        patientData = {
          id: (patient._id as any).toString(),
          patientId: patient.patientId,
          mrn: patient.mrn,
          firstName: patient.firstName,
          lastName: patient.lastName,
          bloodGroup: patient.bloodGroup,
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
          allergies: patient.allergies,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          insurance: patient.insurance,
        };
      }
    }

    return NextResponse.json({
      authenticated: true,
      user,
      patient: patientData,
      role: user.role,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { authenticated: false, error: "Unauthenticated" },
      { status: 401 }
    );
  }
}
