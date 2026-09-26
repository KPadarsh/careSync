import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession, hashPassword } from "@/lib/auth";
import { Patient, User, Appointment, Visit } from "@/models";
import { ROLES } from "@/lib/constants";

const PatientRegisterSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number required"),
  mrn: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).default("male"),
  bloodGroup: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .default("O+"),
  street: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  postalCode: z.string().optional().default(""),
  emergencyName: z.string().optional().default(""),
  emergencyRel: z.string().optional().default(""),
  emergencyPhone: z.string().optional().default(""),
  insuranceProvider: z.string().optional().default(""),
  insurancePolicyNumber: z.string().optional().default(""),
  allergies: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const gender = searchParams.get("gender") || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // Build filter
    let userQuery: Record<string, unknown> = {};
    if (q) {
      userQuery = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
        ],
      };
    }

    let matchingUserIds: unknown[] = [];
    if (q) {
      const users = await User.find(userQuery).select("_id");
      matchingUserIds = users.map((u) => u._id);
    }

    const patientFilter: Record<string, unknown> = {};
    if (q) {
      patientFilter.$or = [
        { mrn: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
        { userId: { $in: matchingUserIds } },
      ];
    }

    if (gender && gender !== "all") {
      patientFilter.gender = gender;
    }
    if (bloodGroup && bloodGroup !== "all") {
      patientFilter.bloodGroup = bloodGroup;
    }

    const total = await Patient.countDocuments(patientFilter);
    const patients = await Patient.find(patientFilter)
      .populate("userId", "name email phone avatar status")
      .populate("primaryDoctorId", "name specialty")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Fetch latest appointment for each patient
    const patientIds = patients.map((p) => p._id);
    const appointments = await Appointment.find({
      patientId: { $in: patientIds },
    })
      .sort({ date: -1 })
      .populate("doctorId", "name specialty");

    const enrichedPatients = patients.map((p) => {
      const patientAppts = appointments.filter(
        (a) => a.patientId.toString() === p._id.toString()
      );
      const lastAppt = patientAppts[0] || null;
      return {
        _id: p._id,
        mrn: p.mrn,
        user: p.userId,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        phone: p.phone,
        address: p.address,
        emergencyContact: p.emergencyContact,
        insurance: p.insurance,
        allergies: p.allergies,
        lastAppointment: lastAppt,
        totalAppointments: patientAppts.length,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      patients: enrichedPatients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception patients GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const body = await req.json();
    const validated = PatientRegisterSchema.parse(body);

    // Check duplicate email
    const existingUser = await User.findOne({ email: validated.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "A patient account with this email address already exists." },
        { status: 409 }
      );
    }

    // Generate MRN if not provided
    let mrn = validated.mrn?.trim().toUpperCase();
    if (!mrn) {
      const count = await Patient.countDocuments();
      mrn = `MRN-${84900 + count + 1}`;
    } else {
      const existingPatient = await Patient.findOne({ mrn });
      if (existingPatient) {
        return NextResponse.json(
          { error: `Medical Record Number (MRN) ${mrn} is already registered.` },
          { status: 409 }
        );
      }
    }

    // Create User record
    const newUser = await User.create({
      name: validated.name,
      email: validated.email.toLowerCase(),
      passwordHash: hashPassword("WelcomeCareSync2026!"),
      role: ROLES.PATIENT,
      phone: validated.phone,
      status: "active",
    });

    // Create Patient profile
    const newPatient = await Patient.create({
      userId: newUser._id,
      mrn,
      dateOfBirth: validated.dateOfBirth ? new Date(validated.dateOfBirth) : undefined,
      gender: validated.gender,
      bloodGroup: validated.bloodGroup,
      phone: validated.phone,
      address: {
        street: validated.street,
        city: validated.city,
        state: validated.state,
        postalCode: validated.postalCode,
      },
      emergencyContact: {
        name: validated.emergencyName,
        relationship: validated.emergencyRel,
        phone: validated.emergencyPhone,
      },
      insurance: {
        provider: validated.insuranceProvider,
        policyNumber: validated.insurancePolicyNumber,
      },
      allergies: validated.allergies,
    });

    return NextResponse.json({
      success: true,
      message: "Patient registered successfully",
      patient: {
        _id: newPatient._id,
        mrn: newPatient.mrn,
        name: newUser.name,
        email: newUser.email,
        phone: newPatient.phone,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception patient registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
