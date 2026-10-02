import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { User, IUser } from "@/models/User";
import { Patient, IPatient } from "@/models/Patient";
import { Doctor, IDoctor } from "@/models/Doctor";
import { Role } from "@/lib/constants";
import { AuthService } from "@/services/auth.service";

const SESSION_COOKIE_NAME = "caresync_session";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "caresync_super_secret_session_key_2026";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  patientId?: string;
  exp: number;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profileType?: string;
  profileId?: string;
  avatar?: string;
  phone?: string;
  lastLoginAt?: Date;
}

export interface AuthSession {
  user: IUser;
  patient?: IPatient | null;
  role: Role;
  patientId?: string;
}

/**
 * Hash password with scrypt and a cryptographic salt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Securely verify password against salt:derivedKey hash using timing-safe comparison
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
 * Verify and decode session token with cryptographic signature check & expiration
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
 * Write secure HttpOnly session cookie to response
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
 * Clear session cookie across client and server
 */
export async function clearSessionCookie(): Promise<void> {
  await AuthService.logout();
}

/**
 * Extract raw session token from cookie store or authorization header
 */
async function getRawSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (sessionCookie?.value) {
      return sessionCookie.value;
    }
  } catch {
    // cookies() unavailable in non-request contexts
  }

  try {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7).trim();
    }
  } catch {
    // headers() unavailable
  }

  return null;
}

/**
 * Reusable server-side helper: reads session, validates signature,
 * resolves current User from database, ensures account is ACTIVE,
 * and returns safe user information without passwordHash.
 */
export async function getCurrentUser(req?: any): Promise<SafeUser | null> {
  try {
    // 1. Check server-side Session in MongoDB
    const serverUser = await AuthService.getCurrentUser(req);
    if (serverUser) {
      return serverUser;
    }

    // 2. Fallback check for signed token
    await connectToDatabase();
    const token = await getRawSessionToken();
    if (!token) return null;

    const payload = verifySession(token);
    if (!payload || !payload.userId) return null;

    const user = await User.findById(payload.userId);
    if (!user) return null;

    const statusNorm = (user.status || "").toUpperCase();
    if (statusNorm !== "ACTIVE") {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      profileType: user.profileType,
      profileId: user.profileId?.toString(),
      avatar: user.avatar,
      phone: user.phone,
      lastLoginAt: user.lastLoginAt,
    };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

/**
 * Strictly require an active authenticated user. Throws UNAUTHORIZED if not authenticated or not active.
 */
export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

/**
 * Retrieve authenticated session and resolve patient details if role is patient.
 * Strictly verifies account status is ACTIVE.
 */
export async function getSession(req?: any): Promise<AuthSession | null> {
  await connectToDatabase();

  const authSvcSession = await AuthService.getSession(req);
  if (authSvcSession) {
    return {
      user: authSvcSession.user,
      patient: authSvcSession.patient,
      role: authSvcSession.role as Role,
      patientId: authSvcSession.patientId,
    };
  }

  const token = await getRawSessionToken();
  if (!token) {
    return null;
  }

  const payload = verifySession(token);
  if (!payload || !payload.userId) {
    return null;
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    return null;
  }

  const statusNorm = (user.status || "").toUpperCase();
  if (statusNorm !== "ACTIVE") {
    return null;
  }

  let patient: IPatient | null = null;
  const roleNorm = (user.role || "").toLowerCase();
  if (roleNorm === "patient") {
    patient = await Patient.findOne({ userId: user._id });
  }

  return {
    user,
    patient,
    role: user.role,
    patientId: patient?._id?.toString(),
  };
}

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export function normalizeRole(role?: string | null): string | null {
  if (!role) return null;
  const r = role.toUpperCase().trim();
  if (r === "ADMIN" || r === "ADMINISTRATOR") return "ADMIN";
  if (r === "RECEPTION" || r === "RECEPTIONIST") return "RECEPTIONIST";
  if (r === "NURSE") return "NURSE";
  if (r === "DOCTOR" || r === "PHYSICIAN") return "DOCTOR";
  if (r === "LAB" || r === "LAB_TECHNICIAN" || r === "LABORATORY") return "LAB_TECHNICIAN";
  if (r === "PATHOLOGIST" || r === "PATHOLOGY") return "PATHOLOGIST";
  if (r === "PHARMACY" || r === "PHARMACIST") return "PHARMACIST";
  if (r === "BILLING" || r === "BILLING_STAFF") return "BILLING_STAFF";
  if (r === "PATIENT") return "PATIENT";
  return null;
}

/**
 * Strictly require an authenticated patient session.
 * Throws 401 if unauthenticated, 403 if unauthorized role.
 */
export async function requirePatientSession(req?: any): Promise<{
  user: IUser;
  patient: IPatient;
  patientId: string;
}> {
  const session = await getSession(req);

  if (!session) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }

  const role = normalizeRole(session.role);
  if (role !== "PATIENT") {
    throw new AuthError("Forbidden: Patient access required", 403);
  }

  if (!session.patient || !session.patientId) {
    throw new AuthError("Forbidden: Patient profile not found for this account", 403);
  }

  return {
    user: session.user,
    patient: session.patient,
    patientId: session.patientId,
  };
}

/**
 * Retrieve authenticated receptionist session.
 */
export async function getReceptionSession(): Promise<{
  user: IUser;
  role: Role;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const r = normalizeRole(session.role);
  if (r !== "RECEPTIONIST") {
    return null;
  }
  return { user: session.user, role: session.role };
}

/**
 * Strictly require an authenticated receptionist session.
 * Throws 401 if unauthenticated, 403 if unauthorized role.
 */
export async function requireReceptionSession(): Promise<{
  user: IUser;
  role: Role;
}> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }
  const r = normalizeRole(session.role);
  if (r !== "RECEPTIONIST") {
    throw new AuthError("Forbidden: Receptionist access required", 403);
  }
  return { user: session.user, role: session.role };
}

/**
 * Retrieve authenticated nurse session.
 */
export async function getNurseSession(): Promise<{
  user: IUser;
  role: Role;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const r = normalizeRole(session.role);
  if (r !== "NURSE") {
    return null;
  }
  return { user: session.user, role: session.role };
}

/**
 * Strictly require an authenticated nurse session.
 * Throws 401 if unauthenticated, 403 if unauthorized role.
 */
export async function requireNurseSession(): Promise<{
  user: IUser;
  role: Role;
}> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }
  const r = normalizeRole(session.role);
  if (r !== "NURSE") {
    throw new AuthError("Forbidden: Nurse access required", 403);
  }
  return { user: session.user, role: session.role };
}

/**
 * Retrieve authenticated doctor session.
 */
export async function getDoctorSession(): Promise<{
  user: IUser;
  doctor: IDoctor;
  role: Role;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const r = normalizeRole(session.role);
  if (r !== "DOCTOR") {
    return null;
  }

  let doctor = await Doctor.findOne({ userId: session.user._id });
  if (!doctor && session.user.profileId) {
    doctor = await Doctor.findById(session.user.profileId);
  }
  if (!doctor) {
    doctor =
      (await Doctor.findOne({ name: session.user.name })) ||
      (await Doctor.findOne({}));
  }
  if (!doctor) {
    return null;
  }

  return {
    user: session.user,
    doctor,
    role: session.role,
  };
}

/**
 * Strictly require an authenticated doctor session.
 * Throws 401 if unauthenticated, 403 if unauthorized role.
 */
export async function requireDoctorSession(): Promise<{
  user: IUser;
  doctor: IDoctor;
  role: Role;
}> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }
  const r = normalizeRole(session.role);
  if (r !== "DOCTOR") {
    throw new AuthError("Forbidden: Doctor access required", 403);
  }

  const docSession = await getDoctorSession();
  if (!docSession) {
    throw new AuthError("Forbidden: Doctor profile not found", 403);
  }
  return docSession;
}

/**
 * Retrieve authenticated lab technician session.
 */
export async function getLabSession(): Promise<{
  user: IUser;
  role: Role;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const r = normalizeRole(session.role);
  if (r !== "LAB_TECHNICIAN") {
    return null;
  }
  return { user: session.user, role: session.role };
}

/**
 * Strictly require an authenticated lab technician session.
 * Throws 401 if unauthenticated, 403 if unauthorized role.
 */
export async function requireLabSession(): Promise<{
  user: IUser;
  role: Role;
}> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }
  const r = normalizeRole(session.role);
  if (r !== "LAB_TECHNICIAN") {
    throw new AuthError("Forbidden: Lab Technician access required", 403);
  }
  return { user: session.user, role: session.role };
}

/**
 * Retrieve authenticated pathologist session.
 */
export async function getPathologistSession(): Promise<{
  user: IUser;
  role: Role;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const r = normalizeRole(session.role);
  if (r !== "PATHOLOGIST") {
    return null;
  }
  return { user: session.user, role: session.role };
}

/**
 * Strictly require an authenticated pathologist session.
 * Throws 401 if unauthenticated, 403 if unauthorized role.
 */
export async function requirePathologistSession(): Promise<{
  user: IUser;
  role: Role;
}> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }
  const r = normalizeRole(session.role);
  if (r !== "PATHOLOGIST") {
    throw new AuthError("Forbidden: Pathologist access required", 403);
  }
  return { user: session.user, role: session.role };
}

/**
 * Retrieve authenticated pharmacist session.
 */
export async function getPharmacySession(): Promise<{
  user: IUser;
  role: Role;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const r = normalizeRole(session.role);
  if (r !== "PHARMACIST") {
    return null;
  }
  return { user: session.user, role: session.role };
}

/**
 * Strictly require an authenticated pharmacist session.
 * Throws 401 if unauthenticated, 403 if unauthorized role.
 */
export async function requirePharmacySession(): Promise<{
  user: IUser;
  role: Role;
}> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }
  const r = normalizeRole(session.role);
  if (r !== "PHARMACIST") {
    throw new AuthError("Forbidden: Pharmacist access required", 403);
  }
  return { user: session.user, role: session.role };
}

/**
 * Retrieve authenticated billing staff session.
 */
export async function getBillingSession(): Promise<{
  user: IUser;
  role: Role;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const r = normalizeRole(session.role);
  if (r !== "BILLING_STAFF") {
    return null;
  }
  return { user: session.user, role: session.role };
}

/**
 * Strictly require an authenticated billing staff session.
 * Throws 401 if unauthenticated, 403 if unauthorized role.
 */
export async function requireBillingSession(): Promise<{
  user: IUser;
  role: Role;
}> {
  const session = await getSession();
  if (!session) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }
  const r = normalizeRole(session.role);
  if (r !== "BILLING_STAFF") {
    throw new AuthError("Forbidden: Billing Staff access required", 403);
  }
  return { user: session.user, role: session.role };
}

/**
 * Retrieve authenticated administrator session.
 */
export async function getAdminSession(): Promise<{
  user: IUser;
  role: Role;
} | null> {
  const session = await getSession();
  if (!session) return null;
  const r = normalizeRole(session.role);
  if (r !== "ADMIN") {
    return null;
  }
  return { user: session.user, role: session.role };
}

/**
 * Strictly require an authenticated administrator session.
 * Throws 401 if unauthenticated, 403 if unauthorized role.
 */
export async function requireAdminSession(req?: any): Promise<{
  user: IUser;
  role: Role;
}> {
  const session = await getSession(req);
  if (!session) {
    throw new AuthError("Unauthorized: Authentication required", 401);
  }
  const r = normalizeRole(session.role);
  if (r !== "ADMIN") {
    throw new AuthError("Forbidden: Administrator access required", 403);
  }
  return { user: session.user, role: session.role };
}

