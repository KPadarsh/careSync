"use client";

import React, { useState, useEffect } from "react";
import {
  UserIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  DispensingIcon,
  LockIcon,
} from "./PharmacyIcons";

export function ProfileView() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pharmacy/profile");
      if (!res.ok) throw new Error("Failed to load pharmacist profile");
      const data = await res.json();
      setProfile(data.profile);
      if (data.profile?.phone) setPhone(data.profile.phone);
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/pharmacy/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      setSuccessMsg("Contact information updated successfully.");
      await fetchProfile();
    } catch (err: any) {
      alert(err.message || "Update error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Pharmacist Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <p className="font-semibold">{error || "Profile not found"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
            STAFF CREDENTIALS & LICENSURE
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Pharmacist Profile
        </h1>
        <p className="text-sm text-slate-400">
          Professional pharmacist credentials, dispensary assignments, and contact details.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Hero Profile Card */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative w-24 h-24 rounded-2xl ring-4 ring-teal-500/30 overflow-hidden shrink-0 shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=300&q=80"
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">{profile.name}</h2>
                <p className="text-xs text-teal-400 font-semibold">{profile.designation}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 self-center sm:self-start">
                Active Staff
              </span>
            </div>

            <div className="text-xs text-slate-400 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <strong className="text-slate-300">Department:</strong> {profile.department}
              </div>
              <div>
                <strong className="text-slate-300">License ID:</strong>{" "}
                <span className="font-mono text-teal-300 font-bold">{profile.licenseNumber}</span>
              </div>
              <div>
                <strong className="text-slate-300">Email:</strong> {profile.email}
              </div>
              <div>
                <strong className="text-slate-300">Shift:</strong> {profile.shift}
              </div>
            </div>
          </div>
        </div>

        {/* Lifetime Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/70">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Dispensed
            </span>
            <div className="text-xl font-extrabold text-white mt-1">
              {profile.stats?.dispensedLifetime || 0}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Verification Score
            </span>
            <div className="text-xl font-extrabold text-teal-400 mt-1">
              {profile.stats?.satisfactionRate || "99.4%"}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Active Queues
            </span>
            <div className="text-xl font-extrabold text-emerald-400 mt-1">
              {profile.stats?.activeSupervisions || 4}
            </div>
          </div>
        </div>
      </div>

      {/* Permissions and Scope of Practice Banner */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
          <ShieldCheckIcon className="w-5 h-5 text-teal-400" />
          <span>Role Permissions & Clinical Scope of Practice</span>
        </div>
        <p className="text-xs text-slate-400">
          In strict accordance with pharmacy board regulations and hospital policy, the Pharmacist role encompasses:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/20 flex items-start gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-slate-300">
              <strong>Permitted:</strong> Prescription review, drug inventory fulfillment, stock deductions, drug counseling logs, clarification requests.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-rose-500/20 flex items-start gap-2">
            <LockIcon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-slate-300">
              <strong>Restricted:</strong> Pharmacists cannot alter doctor prescriptions (dose/duration/frequency locked), diagnose, create clinical consultations, or verify pathology.
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Form */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Emergency On-Call Contact Information
        </h3>

        <form onSubmit={handleSave} className="space-y-4 max-w-md text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Dispensary Direct Line / Mobile
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-all shadow-md"
          >
            {saving ? "Saving..." : "Update Contact"}
          </button>
        </form>
      </div>
    </div>
  );
}
