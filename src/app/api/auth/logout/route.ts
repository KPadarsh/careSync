import { NextResponse } from "next/server";
import { AuthService } from "@/services/auth.service";

/**
 * POST /api/auth/logout
 * Invalidates the current session in MongoDB and clears the HTTP-only cookie.
 */
export async function POST() {
  try {
    await AuthService.logout();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("CareSync Logout error:", error);
    return NextResponse.json(
      { error: "Failed to log out cleanly." },
      { status: 500 }
    );
  }
}
