"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  IconUser,
  IconCheckCircle,
  IconLock,
  IconClock,
  IconBuilding,
  IconShield,
  IconRefresh,
  IconAlertTriangle,
} from "./DoctorIcons";

interface DoctorProfileData {
  _id: string;
  name: string;
  specialty: string;
  department: string;
  qualification: string;
  roomNumber: string;
  avatar?: string;
  email: string;
  phone: string;
  workingHours?: string | { start?: string; end?: string };
  availableDays: string[];
  slotDurationMinutes: number;
  status: string;
}

export function ProfileView() {
  const [profile, setProfile] = useState<DoctorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form editable states
  const [phone, setPhone] = useState("");
  const [qualification, setQualification] = useState("");
  const [roomNumber, setRoomNumber] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/doctor/profile");
      if (res.ok) {
        const data = await res.json();
        const doc = data.doctor;
        setProfile(doc);
        setPhone(doc.phone || "");
        setQualification(doc.qualification || "MBBS, MD (Internal Medicine)");
        setRoomNumber(doc.roomNumber || "Consultation Room 302");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          qualification: qualification.trim(),
          roomNumber: roomNumber.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Profile details updated successfully." });
        if (profile) {
          setProfile({
            ...profile,
            phone,
            qualification,
            roomNumber,
          });
        }
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error while saving profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters." });
      return;
    }

    try {
      setPwdSaving(true);
      setMessage(null);
      const res = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Password changed successfully." });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setMessage({ type: "error", text: data.error || "Password change failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error while changing password." });
    } finally {
      setPwdSaving(false);
    }
  };

  const formatWorkingHours = (wh?: string | { start?: string; end?: string }): string => {
    if (!wh) return "09:00 AM - 05:00 PM";
    if (typeof wh === "string") return wh;
    return `${wh.start || "09:00 AM"} - ${wh.end || "05:00 PM"}`;
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-12 flex flex-col items-center justify-center min-h-[50vh]">
        <IconRefresh className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <span className="text-sm font-medium text-slate-500">Loading doctor profile...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <PageHeader
        title="Doctor Profile"
        description="Manage your clinical credentials, consultation room assignments, and account security."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Active Clinical Staff
          </span>
        }
      />

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-3.5 rounded-xl flex items-center gap-3 border text-xs sm:text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <IconAlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#00355f] to-[#006a68] text-white flex items-center justify-center font-bold text-2xl shadow-md ring-4 ring-slate-100">
            {profile?.name
              ? profile.name
                  .replace("Dr.", "")
                  .trim()
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
              : "DR"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{profile?.name || "Doctor"}</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                On Duty
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">
              {profile?.specialty || "Internal Medicine"} • {profile?.department || "General Medicine"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              CareSync License: #LIC-2026-9812 • Room: {roomNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Slot Duration</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900">{profile?.slotDurationMinutes || 30} mins</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Consultation Shift</p>
            <p className="text-xs sm:text-sm font-bold text-slate-900">{formatWorkingHours(profile?.workingHours)}</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Edit Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <IconUser className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-slate-900">Clinical Credentials &amp; Contact</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={profile?.name || ""}
                  disabled
                  className="w-full h-9 px-3 bg-slate-100/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Specialty</label>
                <input
                  type="text"
                  value={profile?.specialty || ""}
                  disabled
                  className="w-full h-9 px-3 bg-slate-100/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Email Address</label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full h-9 px-3 bg-slate-100/70 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone / Pager Extension</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 018-4921"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Consultation Room</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Room 302"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications &amp; Degrees</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="MBBS, MD (Internal Medicine)"
                  className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-start gap-2 border border-slate-200/60">
              <IconShield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                To modify legal name or medical licenses, contact Clinic Administration or Healthcare Credentialing.
              </span>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
              >
                {saving ? "Saving Changes..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Security & Password */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <IconLock className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-sm text-slate-900">Security &amp; Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={pwdSaving}
              className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
            >
              {pwdSaving ? "Updating Password..." : "Update Password"}
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Two-Factor Authentication</span>
              <span className="text-emerald-700 font-semibold">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Login</span>
              <span className="font-mono text-[11px] text-slate-600">Today, 08:30 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
