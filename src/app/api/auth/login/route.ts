import { NextRequest, NextResponse } from "next/server";
import { AuthService, AuthError, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/services/auth.service";

/**
 * POST /api/auth/login
 * High-performance authentication endpoint for CareSync.
 * Validates credentials, verifies ACTIVE account status in MongoDB,
 * creates a hashed server session, sets an HTTP-only cookie,
 * and returns safe user information without passwordHash.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    const result = await AuthService.login({ email, password });

    const response = NextResponse.json({
      success: true,
      user: result.user,
      patientId: result.patientId,
    });

    if (result.cookieValue) {
      response.cookies.set(SESSION_COOKIE_NAME, result.cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
      });
    }

    return response;
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string; name?: string };
    
    // Robust error classification preventing 500 on valid client auth rejections
    const isAuthErr =
      error instanceof AuthError ||
      err?.name === "AuthError" ||
      err?.statusCode === 400 ||
      err?.statusCode === 401 ||
      err?.statusCode === 403;

    if (isAuthErr) {
      return NextResponse.json(
        { success: false, error: err.message || "Authentication failed" },
        { status: err.statusCode || 401 }
      );
    }

    if (err?.message?.includes("Invalid email or password")) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    console.error("CareSync Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error. Please try again later." },
      { status: 500 }
    );
  }
}
