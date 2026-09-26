import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";
import { Patient, User, Appointment, Visit, FollowUp } from "@/models";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    const patient = await Patient.findById(id)
      .populate("userId", "name email phone avatar status createdAt")
      .populate("primaryDoctorId", "name specialty department roomNumber avatar");

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Appointments for this patient
    const appointments = await Appointment.find({ patientId: patient._id })
      .populate("doctorId", "name specialty department roomNumber")
      .sort({ date: -1, timeSlot: 1 });

    // Visits (read-only for reception)
    const visits = await Visit.find({ patientId: patient._id })
      .populate("doctorId", "name specialty department")
      .select("visitDate reason status doctorId createdAt")
      .sort({ visitDate: -1 });

    // Follow-ups (read-only clinical instructions, actionable scheduling)
    const followUps = await FollowUp.find({ patientId: patient._id })
      .populate("doctorId", "name specialty department")
      .sort({ recommendedDate: 1 });

    return NextResponse.json({
      success: true,
      patient,
      appointments,
      visits,
      followUps,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception patient detail GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid patient ID" }, { status: 400 });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await req.json();

    // STRICT RBAC: Receptionist can ONLY update contact/demographics.
    // Cannot update clinical records, diagnosis, or MRN.
    const allowedPatientFields: Record<string, unknown> = {};

    if (body.phone !== undefined) {
      allowedPatientFields.phone = body.phone;
      // also update user phone
      await User.findByIdAndUpdate(patient.userId, { phone: body.phone });
    }

    if (body.address && typeof body.address === "object") {
      allowedPatientFields.address = {
        street: body.address.street || patient.address?.street || "",
        city: body.address.city || patient.address?.city || "",
        state: body.address.state || patient.address?.state || "",
        postalCode: body.address.postalCode || patient.address?.postalCode || "",
      };
    }

    if (body.emergencyContact && typeof body.emergencyContact === "object") {
      allowedPatientFields.emergencyContact = {
        name: body.emergencyContact.name || patient.emergencyContact?.name || "",
        relationship:
          body.emergencyContact.relationship ||
          patient.emergencyContact?.relationship ||
          "",
        phone: body.emergencyContact.phone || patient.emergencyContact?.phone || "",
      };
    }

    if (body.insurance && typeof body.insurance === "object") {
      allowedPatientFields.insurance = {
        provider: body.insurance.provider || patient.insurance?.provider || "",
        policyNumber:
          body.insurance.policyNumber || patient.insurance?.policyNumber || "",
        groupNumber: body.insurance.groupNumber || patient.insurance?.groupNumber || "",
        expiryDate: body.insurance.expiryDate || patient.insurance?.expiryDate || "",
      };
    }

    if (Array.isArray(body.allergies)) {
      allowedPatientFields.allergies = body.allergies;
    }

    const updated = await Patient.findByIdAndUpdate(
      id,
      { $set: allowedPatientFields },
      { new: true }
    )
      .populate("userId", "name email phone avatar status")
      .populate("primaryDoctorId", "name specialty department roomNumber");

    return NextResponse.json({
      success: true,
      message: "Patient demographics updated successfully",
      patient: updated,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception patient PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
