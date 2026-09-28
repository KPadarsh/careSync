"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Demo accounts for quick testing across CareSync roles
const DEMO_ACCOUNTS = [
  {
    role: "Doctor",
    name: "Dr. Anil Kumar",
    email: "anil@doctor.caresync.com",
    badge: "MD, Cardiology",
    portal: "/doctor/dashboard",
    color: "from-blue-600 to-indigo-700",
  },
  {
    role: "Lab Tech",
    name: "Vikram Malhotra",
    email: "vikram@lab.caresync.com",
    badge: "MLT, Clinical Lab",
    portal: "/lab/dashboard",
    color: "from-amber-600 to-orange-700",
  },
  {
    role: "Nurse",
    name: "Arun Mary",
    email: "arun.mary@nurse.caresync.com",
    badge: "RN, Inpatient Floor",
    portal: "/nurse/dashboard",
    color: "from-emerald-600 to-teal-700",
  },
  {
    role: "Receptionist",
    name: "Sarah Adams",
    email: "sarah@reception.caresync.com",
    badge: "Front Desk & Triage",
    portal: "/reception/dashboard",
    color: "from-purple-600 to-violet-700",
  },
  {
    role: "Pathologist",
    name: "Dr. Sunita Patil",
    email: "sunita@pathology.caresync.com",
    badge: "MD, Pathology",
    portal: "/pathologist/dashboard",
    color: "from-rose-600 to-pink-700",
  },
  {
    role: "Pharmacist",
    name: "Deepak Varma",
    email: "deepak@pharmacy.caresync.com",
    badge: "RPh, Central Pharmacy",
    portal: "/pharmacy/dashboard",
    color: "from-teal-600 to-emerald-700",
  },
  {
    role: "Patient",
    name: "Rahul K.",
    email: "rahul@patient.caresync.com",
    badge: "MRN-2026-00001",
    portal: "/patient/dashboard",
    color: "from-cyan-600 to-blue-700",
  },
];

export default function AuthenticationPage() {
  const router = useRouter();

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  // Form states
  const [email, setEmail] = useState("vikram@lab.caresync.com");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handle Demo Quick-Fill
  const handleQuickFill = (acc: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(acc.email);
    setPassword("Password123!");
    setErrorMsg("");
    setSuccessMsg(`Populated credentials for ${acc.name} (${acc.role})`);
  };

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Check your credentials.");
      }

      setSuccessMsg(`Authenticated as ${data.user?.name || email}. Redirecting...`);

      // Determine portal route by role
      const role = data.user?.role;
      let targetPath = "/patient/dashboard";
      if (role === "doctor") targetPath = "/doctor/dashboard";
      else if (role === "pharmacy") targetPath = "/pharmacy/dashboard";
      else if (role === "pathologist") targetPath = "/pathologist/dashboard";
      else if (role === "lab_technician") targetPath = "/lab/dashboard";
      else if (role === "nurse") targetPath = "/nurse/dashboard";
      else if (role === "reception") targetPath = "/reception/dashboard";
      else if (role === "patient") targetPath = "/patient/dashboard";

      setTimeout(() => {
        router.push(targetPath);
      }, 400);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          phone: regPhone.trim(),
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      setSuccessMsg("Account created successfully! Redirecting to Patient Portal...");
      setTimeout(() => {
        router.push("/patient/dashboard");
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password submission
  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setForgotSent(true);
      setSuccessMsg(`A secure recovery link has been sent to ${forgotEmail || email}.`);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#f8f9ff] text-[#0d1c2d] selection:bg-[#00355f] selection:text-white font-sans antialiased">
      {/* ================= LEFT PANEL: Google Stitch Hospital Brand & Trust (Desktop) ================= */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#002444] text-white flex-col justify-between p-12 xl:p-16 relative overflow-hidden select-none">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#006a68]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#2d6197]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-[#004b80]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#006a68] to-[#2d6197] flex items-center justify-center shadow-lg border border-white/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
              </svg>
            </div>
            <div>
              <span className="text-3xl font-extrabold tracking-tight text-white block">CareSync</span>
              <span className="text-xs uppercase tracking-widest text-[#94f2ef] font-semibold">Clinical Precision Portal</span>
            </div>
          </div>

          <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-snug mb-4">
            Hospital Operations &amp; Management System
          </h1>
          <p className="text-slate-300 text-base xl:text-lg leading-relaxed max-w-lg">
            Connecting every step of patient care. A modern, high-performance workspace uniting doctors, laboratory technicians, nurses, and receptionists.
          </p>
        </div>

        {/* Stitch Trust Markers */}
        <div className="relative z-10 my-10 space-y-5">
          <div className="flex items-start gap-4 p-3.5 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.09]">
            <div className="w-10 h-10 rounded-lg bg-[#006a68]/40 border border-[#94f2ef]/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#94f2ef]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Secure Patient Care</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">Enterprise-grade cryptographic security and full HIPAA compliance.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3.5 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.09]">
            <div className="w-10 h-10 rounded-lg bg-[#006a68]/40 border border-[#94f2ef]/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#94f2ef]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Connected Departments</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">Seamless communication linking Phlebotomy, Pathology, Clinical Wards, and Triage.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-3.5 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.09]">
            <div className="w-10 h-10 rounded-lg bg-[#006a68]/40 border border-[#94f2ef]/30 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#94f2ef]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Real-Time Workflows</h2>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">Instant status synchronization for doctor requisitions, sample barcoding, and stat orders.</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Trusted by healthcare institutions globally</span>
          <span className="font-mono text-[11px] text-[#94f2ef]">v2.6.0-PROD</span>
        </div>
      </div>

      {/* ================= RIGHT PANEL: Stitch AuthCard Form ================= */}
      <div className="w-full lg:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 overflow-y-auto">
        {/* Mobile Header Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8 self-start">
          <div className="w-10 h-10 rounded-xl bg-[#00355f] flex items-center justify-center shadow text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <span className="text-2xl font-bold text-[#00355f]">CareSync</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Hospital Portal</span>
          </div>
        </div>

        <div className="w-full max-w-[460px]">
          {/* Main Auth Container Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 sm:p-9 shadow-lg shadow-slate-200/60 transition-all">
            {/* ================= VIEW 1: SIGN IN ================= */}
            {mode === "login" && (
              <div>
                {/* Header */}
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 mb-3 text-[#00355f]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
                  <p className="text-sm text-slate-500 mt-1">Sign in to access your designated CareSync portal.</p>
                </div>

                {/* Alerts */}
                {errorMsg && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
                    <svg className="w-4 h-4 shrink-0 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
                    <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Demo Quick Select Pill Bar */}
                <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Quick Demo Logins
                    </span>
                    <span className="text-[10px] text-slate-400">Click to autofill</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => handleQuickFill(acc)}
                        className={`px-2.5 py-1.5 rounded-lg text-left border text-xs transition-all ${
                          email === acc.email
                            ? "bg-[#00355f] text-white border-[#00355f] shadow-sm font-medium"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                        }`}
                      >
                        <div className="font-semibold text-[11px] leading-tight truncate">{acc.role}</div>
                        <div className={`text-[10px] leading-tight truncate ${email === acc.email ? "text-slate-200" : "text-slate-400"}`}>
                          {acc.name.split(" ")[0]}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@hospital.org"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider" htmlFor="password">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="text-xs font-medium text-[#006a68] hover:text-[#004f4e] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#00355f] focus:ring-[#00355f] cursor-pointer"
                      />
                      <span>Keep me signed in</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-3 py-3 px-4 rounded-xl bg-[#00355f] hover:bg-[#002847] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-slate-400 font-medium">or</span>
                  </div>
                </div>

                {/* Switch to Register */}
                <div className="text-center text-xs text-slate-500">
                  New patient or staff member?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="font-semibold text-[#006a68] hover:text-[#004f4e] hover:underline"
                  >
                    Create account
                  </button>
                </div>
              </div>
            )}

            {/* ================= VIEW 2: REGISTER ================= */}
            {mode === "register" && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 mb-3 text-[#006a68]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
                  <p className="text-sm text-slate-500 mt-1">Register as a patient to schedule visits and view test results.</p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
                    <svg className="w-4 h-4 shrink-0 text-red-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
                    <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{successMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="regName">
                      Full Legal Name
                    </label>
                    <input
                      id="regName"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="regEmail">
                      Email Address
                    </label>
                    <input
                      id="regEmail"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="priya.sharma@example.com"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="regPhone">
                      Phone Number
                    </label>
                    <input
                      id="regPhone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+1 (555) 345-6789"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="regPassword">
                        Password
                      </label>
                      <input
                        id="regPassword"
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1" htmlFor="regConfirmPassword">
                        Confirm
                      </label>
                      <input
                        id="regConfirmPassword"
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 pt-1">
                    By registering, you agree to CareSync&apos;s Terms of Service and HIPAA Privacy Policy.
                  </p>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-3 py-3 px-4 rounded-xl bg-[#006a68] hover:bg-[#005452] active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-teal-900/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span>Creating Account...</span>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center text-xs text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="font-semibold text-[#00355f] hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}

            {/* ================= VIEW 3: FORGOT PASSWORD ================= */}
            {mode === "forgot" && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 mb-3 text-amber-700">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
                  <p className="text-sm text-slate-500 mt-1">Enter your registered email address to receive password reset instructions.</p>
                </div>

                {forgotSent ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-3">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Instructions Dispatched
                    </div>
                    <p>
                      If an account exists for <span className="font-semibold">{forgotEmail || email}</span>, you will receive an encrypted reset token within 2 minutes.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setForgotSent(false);
                      }}
                      className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-700 text-white font-medium text-xs hover:bg-emerald-800"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5" htmlFor="forgotEmail">
                        Your Registered Email
                      </label>
                      <input
                        id="forgotEmail"
                        type="email"
                        required
                        value={forgotEmail || email}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@hospital.org"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:border-transparent"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#00355f] hover:bg-[#002847] text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                    >
                      {isLoading ? <span>Sending...</span> : <span>Send Recovery Email</span>}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMode("login");
                          setErrorMsg("");
                          setSuccessMsg("");
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Cancel and return to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Direct Portal Quick Links for rapid navigation */}
          <div className="mt-6 p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-700 block mb-2">Direct Portal Routing:</span>
            <div className="flex flex-wrap gap-2">
              <a href="/pathologist/dashboard" className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:text-[#00355f] hover:border-[#00355f] transition-colors">
                🔬 Pathologist Portal
              </a>
              <a href="/lab/dashboard" className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:text-[#00355f] hover:border-[#00355f] transition-colors">
                🧪 Lab Portal
              </a>
              <a href="/doctor/dashboard" className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:text-[#00355f] hover:border-[#00355f] transition-colors">
                👨‍⚕️ Doctor Portal
              </a>
              <a href="/nurse/dashboard" className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:text-[#00355f] hover:border-[#00355f] transition-colors">
                🩺 Nurse Portal
              </a>
              <a href="/reception/dashboard" className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:text-[#00355f] hover:border-[#00355f] transition-colors">
                🏥 Reception Portal
              </a>
              <a href="/patient/dashboard" className="px-2.5 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:text-[#00355f] hover:border-[#00355f] transition-colors">
                🧑‍🦽 Patient Portal
              </a>
            </div>
          </div>

          {/* Footer Area */}
          <div className="mt-6 text-center text-xs text-slate-400">
            <p>© 2026 CareSync Healthcare Operations. All rights reserved.</p>
            <div className="mt-1 space-x-3">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
              <span>·</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
              <span>·</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Security Audit</a>
              <span>·</span>
              <a href="#" className="hover:text-slate-600 transition-colors">Help Desk</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
