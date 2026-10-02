import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Role-to-Portal Access Mapping
const PORTAL_RULES: { prefix: string; allowedRoles: string[] }[] = [
  { prefix: "/admin", allowedRoles: ["ADMIN"] },
  { prefix: "/reception", allowedRoles: ["RECEPTIONIST"] },
  { prefix: "/nurse", allowedRoles: ["NURSE"] },
  { prefix: "/doctor", allowedRoles: ["DOCTOR"] },
  { prefix: "/lab", allowedRoles: ["LAB_TECHNICIAN"] },
  { prefix: "/pathologist", allowedRoles: ["PATHOLOGIST"] },
  { prefix: "/pharmacy", allowedRoles: ["PHARMACIST"] },
  { prefix: "/billing", allowedRoles: ["BILLING_STAFF"] },
  { prefix: "/patient", allowedRoles: ["PATIENT"] },
];

const SESSION_COOKIE_NAME = "caresync_session";

function normalizeRole(role?: string | null): string | null {
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Identify if the requested path is a protected portal route
  const matchedRule = PORTAL_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );

  if (!matchedRule) {
    return NextResponse.next();
  }

  // 2. Validate presence of session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value || sessionCookie.value.trim().length < 16) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. For structured payload tokens (payload.signature), decode role if present
  const parts = sessionCookie.value.split(".");
  if (parts.length === 2) {
    try {
      const payloadStr = Buffer.from(parts[0], "base64url").toString("utf-8");
      const payload = JSON.parse(payloadStr);

      if (payload.exp && Date.now() / 1000 > payload.exp) {
        const loginUrl = new URL("/", request.url);
        return NextResponse.redirect(loginUrl);
      }

      if (payload.role) {
        const userRole = normalizeRole(payload.role);
        if (userRole && !matchedRule.allowedRoles.includes(userRole)) {
          const unauthorizedUrl = new URL("/unauthorized", request.url);
          unauthorizedUrl.searchParams.set("required", matchedRule.prefix.replace("/", ""));
          unauthorizedUrl.searchParams.set("role", userRole || "unknown");
          return NextResponse.redirect(unauthorizedUrl);
        }
      }
    } catch {
      // In case of parsing error, let Node.js runtime verify against DB
    }
  }

  // 4. Authenticated session token present -> continue to portal
  // The server-side AuthService / getCurrentUser independently verifies tokenHash in MongoDB.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/reception/:path*",
    "/nurse/:path*",
    "/doctor/:path*",
    "/lab/:path*",
    "/pathologist/:path*",
    "/pharmacy/:path*",
    "/billing/:path*",
    "/patient/:path*",
  ],
};
