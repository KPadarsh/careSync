import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePatientSession } from "@/lib/auth";
import { Doctor } from "@/models";

export async function GET() {
  try {
    await connectToDatabase();
    const { user, patient } = await requirePatientSession();

    let primaryDoctor = null;
    if (patient.primaryDoctorId) {
      primaryDoctor = await Doctor.findById(patient.primaryDoctorId).select(
        "name specialty department roomNumber avatar"
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        phone: patient.phone || user.phone,
        mrn: patient.mrn,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        dateOfBirth: patient.dateOfBirth,
        address: patient.address || {
          street: "",
          city: "",
          state: "",
          postalCode: "",
        },
        emergencyContact: patient.emergencyContact || {
          name: "",
          relationship: "",
          phone: "",
        },
        insurance: patient.insurance || {
          provider: "",
          policyNumber: "",
          groupNumber: "",
          expiryDate: "",
        },
        allergies: patient.allergies || [],
        primaryDoctor,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Fetch profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user, patient } = await requirePatientSession();

    const body = await req.json();
    const { phone, address, emergencyContact, insurance } = body;

    // Security Rule: Sensitive clinical identity fields (MRN, bloodGroup, DOB) are restricted
    if (phone) {
      patient.phone = phone.trim();
      user.phone = phone.trim();
      await user.save();
    }

    if (address) {
      patient.address = {
        street: address.street?.trim() || patient.address?.street || "",
        city: address.city?.trim() || patient.address?.city || "",
        state: address.state?.trim() || patient.address?.state || "",
        postalCode: address.postalCode?.trim() || patient.address?.postalCode || "",
      };
    }

    if (emergencyContact) {
      patient.emergencyContact = {
        name: emergencyContact.name?.trim() || patient.emergencyContact?.name || "",
        relationship: emergencyContact.relationship?.trim() || patient.emergencyContact?.relationship || "",
        phone: emergencyContact.phone?.trim() || patient.emergencyContact?.phone || "",
      };
    }

    if (insurance) {
      patient.insurance = {
        provider: insurance.provider?.trim() || patient.insurance?.provider || "",
        policyNumber: insurance.policyNumber?.trim() || patient.insurance?.policyNumber || "",
        groupNumber: insurance.groupNumber?.trim() || patient.insurance?.groupNumber || "",
        expiryDate: insurance.expiryDate?.trim() || patient.insurance?.expiryDate || "",
      };
    }

    await patient.save();

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        name: user.name,
        email: user.email,
        phone: patient.phone,
        mrn: patient.mrn,
        bloodGroup: patient.bloodGroup,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        insurance: patient.insurance,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "UNAUTHORIZED_PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
