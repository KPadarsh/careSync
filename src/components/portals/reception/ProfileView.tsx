"use client";

import React, { useState, useEffect } from "react";
import { Icons } from "./ReceptionIcons";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  employeeId: string;
  designation: string;
  department: string;
  terminal: string;
  shift: string;
  status: string;
  createdAt: string;
}

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit details form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState(false);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/reception/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const json = await res.json();
        setProfile(json.profile);
        setName(json.profile.name);
        setPhone(json.profile.phone);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingDetails(true);
      setDetailsSuccess(false);
      const res = await fetch("/api/reception/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update profile");
      setProfile((prev) => (prev ? { ...prev, name, phone } : prev));
      setDetailsSuccess(true);
      setTimeout(() => setDetailsSuccess(false), 3000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setSavingPassword(true);
      const res = await fetch("/api/reception/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to change password");

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading staff profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-700">
        {error || "Could not retrieve staff profile."}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
          Employee Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Front desk staff credentials, assigned terminal, and security settings
        </p>
      </div>

      {/* STAFF PROFILE HERO */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xl ring-4 ring-teal-50 shrink-0">
            SA
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{profile.name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-50 text-teal-800 border border-teal-200">
                Level 2 Desk Lead
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">{profile.designation}</p>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Employee ID: {profile.employeeId} • {profile.terminal}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:self-start">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active On-Duty
          </span>
        </div>
      </div>

      {/* 2-COLUMN SETTINGS FORM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: PERSONAL & WORKSTATION DETAILS */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Personal Information
          </h3>

          {detailsSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
              Personal details updated successfully.
            </div>
          )}

          <form onSubmit={handleUpdateDetails} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Clinic Work Email</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Work email can only be changed by Clinic IT Admin.
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Desk Extension / Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Assigned Workstation Shift</label>
              <input
                type="text"
                disabled
                value={profile.shift}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
              />
            </div>

            {/* LOCKED ROLE INDICATOR */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">System Role:</span>
                <span className="font-mono uppercase font-bold text-teal-800">
                  {profile.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Role-based access boundaries are enforced. Receptionists cannot self-elevate permissions.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingDetails}
              className="w-full py-2 px-4 bg-[#00355f] hover:bg-[#002847] text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {savingDetails ? "Saving..." : "Save Details"}
            </button>
          </form>
        </div>

        {/* RIGHT: SECURITY & PASSWORD */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Authentication &amp; Password
            </h3>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
                Password changed successfully.
              </div>
            )}
            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2 px-4 bg-[#006a68] hover:bg-[#005452] text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {savingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* ACTIVE CERTIFICATIONS BADGES */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Staff Certifications
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-800">HIPAA Security &amp; Patient Privacy</span>
                <span className="text-teal-700 font-bold text-[10px]">Verified 2026</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-800">Basic Life Support (BLS/CPR)</span>
                <span className="text-teal-700 font-bold text-[10px]">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
