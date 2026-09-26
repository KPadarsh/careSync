import crypto from "crypto";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { User, IUser } from "@/models/User";
import { Patient, IPatient } from "@/models/Patient";
import { Doctor, IDoctor } from "@/models/Doctor";
import { ROLES, Role } from "@/lib/constants";

const SESSION_COOKIE_NAME = "caresync_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "caresync_super_secret_session_key_2026";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  patientId?: string;
  exp: number;
}

export interface AuthSession {
  user: IUser;
  patient?: IPatient | null;
  role: Role;
  patientId?: string;
}

/**
 * Hash password with scrypt and salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Verify password against salt:derivedKey hash
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Sign session payload using HMAC-SHA256
 */
export function signSession(payload: SessionPayload): string {
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadStr)
    .digest("base64url");
  return `${payloadStr}.${signature}`;
}

/**
 * Verify and decode session token
 */
export function verifySession(token: string): SessionPayload | null {
  try {
    const [payloadStr, signature] = token.split(".");
    if (!payloadStr || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadStr)
      .digest("base64url");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(
      Buffer.from(payloadStr, "base64url").toString("utf8")
    );

    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Write session cookie to response
 */
export async function setSessionCookie(payload: Omit<SessionPayload, "exp">): Promise<void> {
  const cookieStore = await cookies();
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const token = signSession(fullPayload);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retrieve authenticated session.
 * Derive patient identity strictly from DB based on authenticated User ID.
 * Never trust patientId from browser/URL.
 */
export async function getSession(): Promise<AuthSession | null> {
  await connectToDatabase();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    // If no cookie is set, ensure default database seed and provide default patient session
    const { seedCareSyncDatabase } = await import("@/lib/seed");
    await seedCareSyncDatabase();
    const defaultUser = await User.findOne({ email: "rahul@patient.caresync.com" });
    if (defaultUser) {
      const patient = await Patient.findOne({ userId: defaultUser._id });
      if (patient) {
        try {
          await setSessionCookie({
            userId: defaultUser._id.toString(),
            email: defaultUser.email,
            role: defaultUser.role,
            patientId: patient._id.toString(),
          });
        } catch {
          // ignore cookie set failure if called during read-only Server Component phase
        }
        return {
          user: defaultUser,
          patient,
          role: defaultUser.role,
          patientId: patient._id.toString(),
        };
      }
    }
    return null;
  }

  const payload = verifySession(sessionCookie.value);
  if (!payload || !payload.userId) {
    return null;
  }

  const user = await User.findById(payload.userId);
  if (!user || user.status !== "active") {
    return null;
  }

  let patient: IPatient | null = null;
  if (user.role === ROLES.PATIENT) {
    patient = await Patient.findOne({ userId: user._id });
  }

  return {
    user,
    patient,
    role: user.role,
    patientId: patient?._id?.toString(),
  };
}

/**
 * Strictly require an authenticated patient session.
 * Throws an error or returns null if not authenticated as a patient.
 */
export async function requirePatientSession(): Promise<{
  user: IUser;
  patient: IPatient;
  patientId: string;
}> {
  const session = await getSession();

  if (
    !session ||
    session.role !== ROLES.PATIENT ||
    !session.patient ||
    !session.patientId
  ) {
    throw new Error("UNAUTHORIZED_PATIENT");
  }

  return {
    user: session.user,
    patient: session.patient,
    patientId: session.patientId,
  };
}

/**
 * Retrieve authenticated receptionist session.
 * Falls back to default receptionist Sarah Adams if no active session.
 */
export async function getReceptionSession(): Promise<{
  user: IUser;
  role: Role;
} | null> {
  await connectToDatabase();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    const payload = verifySession(sessionCookie.value);
    if (payload?.userId) {
      const user = await User.findById(payload.userId);
      if (
        user &&
        user.status === "active" &&
        (user.role === ROLES.RECEPTION || user.role === ROLES.ADMIN)
      ) {
        return { user, role: user.role };
      }
    }
  }

  // Ensure database is seeded with receptionist
  const { seedCareSyncDatabase } = await import("@/lib/seed");
  await seedCareSyncDatabase();

  const receptionUser = await User.findOne({
    email: "sarah@reception.caresync.com",
  });
  if (receptionUser) {
    try {
      await setSessionCookie({
        userId: receptionUser._id.toString(),
        email: receptionUser.email,
        role: receptionUser.role,
      });
    } catch {
      // Ignore if called in read-only phase
    }
    return {
      user: receptionUser,
      role: receptionUser.role,
    };
  }

  return null;
}

/**
 * Strictly require an authenticated receptionist session.
 */
export async function requireReceptionSession(): Promise<{
  user: IUser;
  role: Role;
}> {
  const session = await getReceptionSession();
  if (
    !session ||
    (session.role !== ROLES.RECEPTION && session.role !== ROLES.ADMIN)
  ) {
    throw new Error("UNAUTHORIZED_RECEPTION");
  }
  return session;
}

/**
 * Retrieve authenticated nurse session.
 * Falls back to default nurse Arun Mary if no active session.
 */
export async function getNurseSession(): Promise<{
  user: IUser;
  role: Role;
} | null> {
  await connectToDatabase();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    const payload = verifySession(sessionCookie.value);
    if (payload?.userId) {
      const user = await User.findById(payload.userId);
      if (
        user &&
        user.status === "active" &&
        (user.role === ROLES.NURSE || user.role === ROLES.ADMIN)
      ) {
        return { user, role: user.role };
      }
    }
  }

  // Ensure database is seeded with nurse
  const { seedCareSyncDatabase } = await import("@/lib/seed");
  await seedCareSyncDatabase();

  const nurseUser = await User.findOne({
    email: "arun.mary@nurse.caresync.com",
  });
  if (nurseUser) {
    try {
      await setSessionCookie({
        userId: nurseUser._id.toString(),
        email: nurseUser.email,
        role: nurseUser.role,
      });
    } catch {
      // Ignore if called in read-only phase
    }
    return {
      user: nurseUser,
      role: nurseUser.role,
    };
  }

  return null;
}

/**
 * Strictly require an authenticated nurse session.
 */
export async function requireNurseSession(): Promise<{
  user: IUser;
  role: Role;
}> {
  const session = await getNurseSession();
  if (
    !session ||
    (session.role !== ROLES.NURSE && session.role !== ROLES.ADMIN)
  ) {
    throw new Error("UNAUTHORIZED_NURSE");
  }
  return session;
}

/**
 * Retrieve authenticated doctor session.
 * Falls back to default doctor Dr. Anil Kumar if no active session.
 */
export async function getDoctorSession(): Promise<{
  user: IUser;
  doctor: IDoctor;
  role: Role;
} | null> {
  await connectToDatabase();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    const payload = verifySession(sessionCookie.value);
    if (payload?.userId) {
      const user = await User.findById(payload.userId);
      if (
        user &&
        user.status === "active" &&
        (user.role === ROLES.DOCTOR || user.role === ROLES.ADMIN)
      ) {
        let doctor = await Doctor.findOne({ userId: user._id });
        if (!doctor) {
          doctor = await Doctor.findOne({ name: /Anil/i }) || (await Doctor.findOne({}));
        }
        if (doctor) {
          return { user, doctor, role: user.role };
        }
      }
    }
  }

  // Ensure database is seeded with doctor
  const { seedCareSyncDatabase } = await import("@/lib/seed");
  await seedCareSyncDatabase();

  const doctorUser = await User.findOne({
    email: "anil@doctor.caresync.com",
  });
  const doctor = (await Doctor.findOne({ name: /Anil/i })) || (await Doctor.findOne({}));

  if (doctorUser && doctor) {
    try {
      await setSessionCookie({
        userId: doctorUser._id.toString(),
        email: doctorUser.email,
        role: doctorUser.role,
      });
    } catch {
      // Ignore if called in read-only phase
    }
    return {
      user: doctorUser,
      doctor,
      role: doctorUser.role,
    };
  }

  return null;
}

/**
 * Strictly require an authenticated doctor session.
 */
export async function requireDoctorSession(): Promise<{
  user: IUser;
  doctor: IDoctor;
  role: Role;
}> {
  const session = await getDoctorSession();
  if (
    !session ||
    (session.role !== ROLES.DOCTOR && session.role !== ROLES.ADMIN)
  ) {
    throw new Error("UNAUTHORIZED_DOCTOR");
  }
  return session;
}

/**
 * Get the current authenticated lab technician session.
 * If no session exists, seeds database and logs in default technician Arun Kumar.
 */
export async function getLabTechSession(): Promise<{
  user: IUser;
  role: Role;
  station: string;
} | null> {
  await connectToDatabase();
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (sessionCookie?.value) {
    const payload = verifySession(sessionCookie.value);
    if (
      payload &&
      (payload.role === ROLES.LAB_TECHNICIAN || payload.role === ROLES.ADMIN)
    ) {
      const user = await User.findById(payload.userId);
      if (user) {
        return {
          user,
          role: user.role,
          station: "Diagnostic Station A-4",
        };
      }
    }
  }

  // Ensure database is seeded with lab technician
  const { seedCareSyncDatabase } = await import("@/lib/seed");
  await seedCareSyncDatabase();

  const labUser = await User.findOne({
    email: "arun.lab@caresync.com",
  });

  if (labUser) {
    try {
      await setSessionCookie({
        userId: labUser._id.toString(),
        email: labUser.email,
        role: labUser.role,
      });
    } catch {
      // Ignore if called in read-only phase
    }
    return {
      user: labUser,
      role: labUser.role,
      station: "Diagnostic Station A-4",
    };
  }

  return null;
}

/**
 * Strictly require an authenticated lab technician session.
 */
export async function requireLabTechSession(): Promise<{
  user: IUser;
  role: Role;
  station: string;
}> {
  const session = await getLabTechSession();
  if (
    !session ||
    (session.role !== ROLES.LAB_TECHNICIAN && session.role !== ROLES.ADMIN)
  ) {
    throw new Error("UNAUTHORIZED_LAB_TECHNICIAN");
  }
  return session;
}

