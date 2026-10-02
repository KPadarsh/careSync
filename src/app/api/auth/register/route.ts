import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Patient } from "@/models/Patient";
import { hashPassword, AuthService, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/services/auth.service";
import { ROLES } from "@/lib/constants";

/**
 * Generate a collision-safe sequential Medical Record Number (MRN).
 */
async function generatePatientMRN(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `MRN-${currentYear}-`;

  const latest = await Patient.findOne({ mrn: { $regex: `^${prefix}\\d+` } })
    .sort({ mrn: -1 })
    .select("mrn")
    .lean();

  let nextSeq = 1;
  if (latest?.mrn) {
    const parts = latest.mrn.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num)) nextSeq = num + 1;
  }

  let candidate = `${prefix}${String(nextSeq).padStart(5, "0")}`;
  while (await Patient.exists({ $or: [{ mrn: candidate }, { patientId: candidate }] })) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(5, "0")}`;
  }
  return candidate;
}

export async function POST(req: NextRequest) {
  let createdUser: any = null;
  let createdPatient: any = null;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, password, phone, age, bloodGroup, gender } = body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    // Calculate birth date from age if provided
    let calculatedDob = new Date("1995-01-01");
    if (age !== undefined && age !== null && age !== "") {
      const parsedAge = parseInt(String(age), 10);
      if (!isNaN(parsedAge) && parsedAge >= 0 && parsedAge <= 125) {
        const currentYear = new Date().getFullYear();
        calculatedDob = new Date(currentYear - parsedAge, 0, 1);
      }
    }

    // Normalize blood group
    const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    const normalizedBloodGroup =
      bloodGroup && validBloodGroups.includes(String(bloodGroup).trim().toUpperCase())
        ? (String(bloodGroup).trim().toUpperCase() as "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-")
        : "O+";

    // Normalize gender
    const validGenders = ["male", "female", "other"] as const;
    type GenderType = (typeof validGenders)[number];
    const inputGender = String(gender || "").trim().toLowerCase() as GenderType;
    const normalizedGender: GenderType = validGenders.includes(inputGender) ? inputGender : "other";

    // 1. Create User
    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: ROLES.PATIENT,
      profileType: "Patient",
      phone: phone?.trim() || "",
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80`,
      status: "ACTIVE",
    });

    // 2. Generate unique collision-safe MRN
    const mrn = await generatePatientMRN();

    // 3. Create Patient
    createdPatient = await Patient.create({
      userId: createdUser._id,
      patientId: mrn,
      mrn,
      firstName: name.trim().split(" ")[0] || "Patient",
      lastName: name.trim().split(" ").slice(1).join(" ") || "User",
      dateOfBirth: calculatedDob,
      gender: normalizedGender,
      bloodGroup: normalizedBloodGroup,
      email: normalizedEmail,
      phone: phone?.trim() || "+1 (555) 000-0000",
      status: "ACTIVE",
      emergencyContact: {
        name: "Emergency Contact",
        relationship: "Family",
        phone: phone?.trim() || "+1 (555) 000-0000",
      },
    });

    // 4. Link User.profileId
    createdUser.profileId = createdPatient._id;
    await createdUser.save();

    // 5. Create Server Session in MongoDB
    const { cookieValue } = await AuthService.createSessionForUser(
      createdUser,
      createdPatient._id.toString()
    );

    // 6. Build response and set HTTP-only cookie directly on response object
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: createdUser._id.toString(),
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          avatar: createdUser.avatar,
        },
        patientId: createdPatient._id.toString(),
      },
      { status: 201 }
    );

    if (cookieValue) {
      response.cookies.set(SESSION_COOKIE_NAME, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    }

    return response;
  } catch (error: any) {
    // Explicit rollback on failure
    if (createdPatient?._id) {
      await Patient.deleteOne({ _id: createdPatient._id }).catch(() => {});
    }
    if (createdUser?._id) {
      await User.deleteOne({ _id: createdUser._id }).catch(() => {});
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: "An account with this email or identifier already exists." },
        { status: 409 }
      );
    }

    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create account." },
      { status: error.statusCode || 400 }
    );
  }
}
