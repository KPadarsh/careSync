import crypto from "crypto";
import mongoose from "mongoose";
import { cookies, headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { User, IUser } from "@/models/User";
import { Session, ISession } from "@/models/Session";
import { Patient, IPatient } from "@/models/Patient";

export const SESSION_COOKIE_NAME = "caresync_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

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
  session: ISession;
  patient?: IPatient | null;
  role: string;
  patientId?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface LoginResult {
  user: SafeUser;
  patientId?: string;
  cookieValue?: string;
}

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Cryptographic helper: Asynchronously hashes password using scrypt on libuv threadpool (non-blocking).
 */
export async function hashPasswordAsync(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Cryptographic helper: Synchronously hashes password with scrypt and a cryptographic salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

/**
 * Cryptographic helper: Asynchronously verifies password against salt:derivedKey hash (non-blocking).
 */
export async function verifyPasswordAsync(password: string, combinedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      if (!password || !combinedHash) return resolve(false);
      const [salt, key] = combinedHash.split(":");
      if (!salt || !key) return resolve(false);
      const keyBuffer = Buffer.from(key, "hex");
      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return resolve(false);
        try {
          resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
        } catch {
          resolve(false);
        }
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Cryptographic helper: Synchronously verifies password against salt:derivedKey hash using timing-safe comparison.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    if (!password || !combinedHash) return false;
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
 * Hashes a raw session token with SHA-256 for secure database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Generates a cryptographically secure random session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Helper to parse raw token from session cookie payload or raw string
 */
export function parseTokenFromCookie(rawVal: string): string {
  if (!rawVal) return "";
  let val = rawVal.trim();
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.slice(1, -1);
  }
  if (val.includes(".")) {
    const [payloadStr] = val.split(".");
    try {
      const parsed = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"));
      return parsed.token || val;
    } catch {
      return val;
    }
  }
  return val;
}

/**
 * Centralized, High-Performance Authentication Service
 */
export class AuthService {
  /**
   * Helper to create a secure session in MongoDB and set the HTTP-only cookie.
   */
  static async createSessionForUser(
    user: { _id: any; role: string; email: string },
    patientId?: string
  ): Promise<{ rawToken: string; tokenHash: string; cookieValue: string; expiresAt: Date }> {
    await connectToDatabase();

    const rawToken = generateSessionToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

    // Fast session insert
    await Session.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      lastUsedAt: new Date(),
    });

    const cookiePayload = {
      token: rawToken,
      userId: user._id.toString(),
      role: user.role,
      patientId,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
    };
    const payloadStr = Buffer.from(JSON.stringify(cookiePayload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", process.env.SESSION_SECRET || "caresync_super_secret_session_key_2026")
      .update(payloadStr)
      .digest("base64url");
    const cookieValue = `${payloadStr}.${signature}`;

    // Safely attempt to set cookie via cookies() if in valid request context
    try {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    } catch {
      // In contexts without cookies(), callers use returned cookieValue on response.cookies.set()
    }

    return { rawToken, tokenHash, cookieValue, expiresAt };
  }

  /**
   * Authenticates user against MongoDB User collection with non-blocking crypto and connection pooling.
   */
  static async login(params: LoginParams): Promise<LoginResult> {
    await connectToDatabase();

    const { email, password } = params;

    // 1. Input validation
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      throw new AuthError("Email and password are required.", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new AuthError("Please provide a valid email address.", 400);
    }

    // 2. Query User model
    const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
    if (!user) {
      throw new AuthError("Invalid email or password.", 401);
    }

    // 3. Status Check
    const statusNorm = (user.status || "").toUpperCase();
    if (statusNorm === "SUSPENDED") {
      throw new AuthError("Account is suspended. Please contact administrator.", 403);
    }
    if (statusNorm === "INACTIVE") {
      throw new AuthError("Account is inactive. Please contact administrator.", 403);
    }
    if (statusNorm !== "ACTIVE") {
      throw new AuthError("Account is not active. Please contact administrator.", 403);
    }

    // 4. Verify password with non-blocking async scrypt
    const isPasswordValid = await verifyPasswordAsync(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError("Invalid email or password.", 401);
    }

    // 5. Update lastLoginAt asynchronously without blocking response
    User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } }).catch(() => {});

    // 6. Resolve patient ID if role is patient
    let patientId: string | undefined;
    if ((user.role || "").toLowerCase() === "patient") {
      const patient = await Patient.findOne({ userId: user._id }).select("_id").lean();
      patientId = patient?._id?.toString();
    }

    // 7. Store session in MongoDB & set cookie
    const { cookieValue } = await this.createSessionForUser(user, patientId);

    // 8. Return Safe User Object
    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profileType: user.profileType,
        profileId: user.profileId?.toString(),
        avatar: user.avatar,
        phone: user.phone,
        lastLoginAt: new Date(),
      },
      patientId,
      cookieValue,
    };
  }

  /**
   * Logs out the user by deleting the session from MongoDB and clearing the cookie.
   */
  static async logout(): Promise<void> {
    try {
      await connectToDatabase();
      const rawToken = await this.getRawSessionToken();
      if (rawToken) {
        const tokenHash = hashToken(rawToken);
        await Session.deleteOne({ tokenHash }).catch(() => {});
      }
    } catch {
      // Ignore DB errors during logout
    }

    try {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_COOKIE_NAME);
      cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    } catch {
      // Ignore cookie errors
    }
  }

  /**
   * Fast, non-blocking check to retrieve authenticated user.
   */
  static async getCurrentUser(req?: any): Promise<SafeUser | null> {
    try {
      await connectToDatabase();
      const rawToken = await this.getRawSessionToken(req);
      console.log("[getCurrentUser] rawToken:", rawToken ? (rawToken.substring(0, 10) + "...") : "null");
      if (!rawToken) return null;

      const tokenHash = hashToken(rawToken);

      // Fast indexed query: active non-expired session
      const session = await Session.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
      }).lean();

      console.log("[getCurrentUser] session found:", !!session, "for tokenHash:", tokenHash.substring(0, 10) + "...");
      if (!session) return null;

      const user = await User.findById(session.userId).lean();
      console.log("[getCurrentUser] user found:", !!user, "status:", user?.status);
      if (!user) return null;

      const statusNorm = (user.status || "").toUpperCase();
      if (statusNorm !== "ACTIVE") {
        console.log("[getCurrentUser] user status not active:", user.status);
        return null;
      }

      // Update lastUsedAt in the background only if older than 5 minutes
      if (!session.lastUsedAt || Date.now() - new Date(session.lastUsedAt).getTime() > 5 * 60 * 1000) {
        Session.updateOne({ _id: session._id }, { $set: { lastUsedAt: new Date() } }).catch(() => {});
      }

      return {
        id: (user._id as any).toString(),
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
   * Resolves complete AuthSession including database User and Session models in minimal queries.
   */
  static async getSession(req?: any): Promise<AuthSession | null> {
    try {
      await connectToDatabase();
      const rawToken = await this.getRawSessionToken(req);
      if (!rawToken) return null;

      const tokenHash = hashToken(rawToken);

      const session = await Session.findOne({
        tokenHash,
        expiresAt: { $gt: new Date() },
      });

      if (!session) return null;

      const user = await User.findById(session.userId);
      if (!user) return null;

      const statusNorm = (user.status || "").toUpperCase();
      if (statusNorm !== "ACTIVE") {
        return null;
      }

      let patient: IPatient | null = null;
      if ((user.role || "").toLowerCase() === "patient") {
        patient = await Patient.findOne({ userId: user._id });
      }

      return {
        user,
        session,
        patient,
        role: user.role,
        patientId: patient?._id?.toString(),
      };
    } catch (error) {
      console.error("getSession error:", error);
      return null;
    }
  }

  /**
   * Helper to retrieve raw session token from cookies or authorization header.
   */
  static async getRawSessionToken(req?: any): Promise<string | null> {
    // 0. If req is provided, check req.cookies or headers directly
    if (req) {
      try {
        // Check req.cookies
        if (req.cookies) {
          const c = typeof req.cookies.get === "function" ? req.cookies.get(SESSION_COOKIE_NAME) : req.cookies[SESSION_COOKIE_NAME];
          const rawVal = typeof c === "string" ? c : c?.value;
          if (rawVal) {
            const token = parseTokenFromCookie(rawVal);
            if (token) return token;
          }
        }

        // Check req.headers (Cookie header and Authorization header)
        if (req.headers) {
          const cookieHdr = typeof req.headers.get === "function" ? req.headers.get("cookie") : req.headers.cookie;
          if (cookieHdr) {
            const match = cookieHdr.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
            if (match?.[1]) {
              const token = parseTokenFromCookie(decodeURIComponent(match[1]));
              if (token) return token;
            }
          }

          const authHdr = typeof req.headers.get === "function" ? req.headers.get("authorization") : req.headers.authorization;
          if (authHdr?.startsWith("Bearer ")) {
            return authHdr.substring(7).trim();
          }
        }
      } catch (e) {
        console.error("Error reading from req:", e);
      }
    }

    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
      if (sessionCookie?.value) {
        const token = parseTokenFromCookie(sessionCookie.value);
        if (token) return token;
      }
    } catch {
      // Outside RequestAsyncLocalStorage context
    }

    try {
      const headerStore = await headers();
      const authHeader = headerStore.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        return authHeader.substring(7).trim();
      }

      const rawCookie = headerStore.get("cookie");
      if (rawCookie) {
        const match = rawCookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
        if (match && match[1]) {
          const token = parseTokenFromCookie(decodeURIComponent(match[1]));
          if (token) return token;
        }
      }
    } catch {
      // Outside RequestAsyncLocalStorage context
    }

    return null;
  }
}
