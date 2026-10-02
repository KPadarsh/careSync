"use client";

import React, { useState, useEffect } from "react";
import {
  AdminShell,
  UserIcon,
  ShieldIcon,
  CheckCircleIcon,
  BuildingIcon,
  StaffIcon,
  DoctorsIcon,
  DepartmentsIcon,
  AuditLogsIcon,
} from "./AdminShell";

interface ProfileData {
  name: string;
  email: string;
  role: string;
  phone: string;
  department: string;
  station: string;
  badgeId: string;
  joinedDate: string;
  systemMetrics: {
    staffManaged: number;
    doctorsManaged: number;
    departmentsManaged: number;
    auditActionsLogged: number;
  };
}

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.profile);
          setPhoneInput(data.profile.phone || "");
        }
      })
      .catch((err) => console.error("Error loading admin profile:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Error updating phone:", err);
    }
  };

  return (
    <AdminShell activeKey="profile">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-inner flex-shrink-0">
              {(profile?.name || "AD").split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "AD"}
            </div>
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                System Administrator • Root Governance
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {profile?.name || "Administrator"}
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                {profile?.role || "System Administrator"} • {profile?.department || "Hospital Operations & IT Governance"}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  Email: {profile?.email || "—"}
                </span>
                <span className="flex items-center gap-1.5">
                  Station: {profile?.station || "—"}
                </span>
                <span className="flex items-center gap-1.5 font-mono">
                  Badge ID: {profile?.badgeId || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Scope Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Staff Profiles</span>
              <StaffIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {profile?.systemMetrics?.staffManaged ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Personnel records</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Physicians</span>
              <DoctorsIcon className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {profile?.systemMetrics?.doctorsManaged ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Clinical doctors</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Departments</span>
              <DepartmentsIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {profile?.systemMetrics?.departmentsManaged ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Hospital divisions</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-slate-500">Audit Trail</span>
              <AuditLogsIcon className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {profile?.systemMetrics?.auditActionsLogged ?? 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Actions recorded</div>
          </div>
        </div>

        {/* Contact Update Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <ShieldIcon className="w-4 h-4 text-indigo-600" />
            Administrative Contact Information
          </div>

          {saved && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              <span>Contact details updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleSavePhone} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Direct Emergency Phone Number
              </label>
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div className="sm:self-end w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              >
                Save Phone
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
