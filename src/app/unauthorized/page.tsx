"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useCurrentUser();

  const requiredPortal = searchParams.get("required") || "portal";

  const getDashboardHref = () => {
    if (!user) return "/";
    const r = (user.role || "").toUpperCase();
    if (r === "ADMIN") return "/admin/dashboard";
    if (r === "RECEPTIONIST" || r === "RECEPTION") return "/reception/dashboard";
    if (r === "NURSE") return "/nurse/dashboard";
    if (r === "DOCTOR") return "/doctor/dashboard";
    if (r === "LAB_TECHNICIAN" || r === "LAB") return "/lab/dashboard";
    if (r === "PATHOLOGIST") return "/pathologist/dashboard";
    if (r === "PHARMACIST" || r === "PHARMACY") return "/pharmacy/dashboard";
    if (r === "BILLING_STAFF" || r === "BILLING") return "/billing/dashboard";
    return "/patient/dashboard";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl mx-auto flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your account does not have authorization to access the{" "}
            <span className="font-semibold text-slate-800 capitalize">{requiredPortal}</span> portal.
          </p>
          {!loading && user && (
            <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Logged in as: {user.name} ({user.role})
            </div>
          )}
        </div>

        <div className="pt-2 space-y-3">
          <button
            type="button"
            onClick={() => router.push(getDashboardHref())}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-xs"
          >
            Return to Authorized Dashboard
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-sm text-slate-500">Loading access verification...</div>
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}
