"use client";

import React, { useState, useEffect } from "react";
import {
  IconUser,
  IconCheckCircle,
  IconLock,
  IconClock,
  IconBuilding,
  IconShield,
  IconRefresh,
  IconCheck,
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
  workingHours: string;
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
      setMessage({ type: "error", text: "Network error while saving." });
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

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-secondary bg-white rounded-xl border border-outline-variant/30">
        <IconRefresh className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
        Loading clinical profile...
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Doctor Profile</h1>
        <p className="text-sm text-secondary">
          Manage your personal medical credentials, consultation room assignments, and account security.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-tertiary-fixed/30 border-tertiary-fixed text-on-tertiary-fixed"
              : "bg-error-container border-error/30 text-error"
          }`}
        >
          {message.type === "success" ? (
            <IconCheckCircle className="w-5 h-5 shrink-0 text-tertiary" />
          ) : (
            <IconAlertTriangle className="w-5 h-5 shrink-0 text-error" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-md ring-4 ring-primary/10">
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
              <h2 className="text-xl font-bold text-on-surface">{profile?.name || "Dr. Anil Kumar"}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary-fixed/40 text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                On Duty
              </span>
            </div>
            <p className="text-sm font-medium text-primary mt-0.5">
              {profile?.specialty || "Internal Medicine"} • {profile?.department || "General Medicine"}
            </p>
            <p className="text-xs text-secondary mt-1 font-mono">
              CareSync License: #LIC-2026-9812 • Room: {roomNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30">
          <div>
            <p className="text-[11px] text-secondary font-medium">Slot Duration</p>
            <p className="text-sm font-bold text-on-surface">{profile?.slotDurationMinutes || 30} mins</p>
          </div>
          <div className="h-8 w-px bg-outline-variant/40"></div>
          <div>
            <p className="text-[11px] text-secondary font-medium">Consultation Shift</p>
            <p className="text-sm font-bold text-on-surface">{profile?.workingHours || "09:00 - 17:00"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Edit Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6 space-y-6">
          <div className="border-b border-outline-variant/30 pb-3 flex items-center gap-2">
            <IconUser className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-on-surface">Clinical Credentials &amp; Contact</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={profile?.name || ""}
                  disabled
                  className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm text-secondary cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Medical Specialty</label>
                <input
                  type="text"
                  value={profile?.specialty || ""}
                  disabled
                  className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm text-secondary cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondary mb-1">Clinic Email Address</label>
                <input
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm text-secondary cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Phone / Pager Extension</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 018-4921"
                  className="w-full h-10 px-3 bg-white border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Assigned Consultation Room</label>
                <input
                  type="text"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Room 302"
                  className="w-full h-10 px-3 bg-white border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Qualifications &amp; Degrees</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="MBBS, MD (Internal Medicine)"
                  className="w-full h-10 px-3 bg-white border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-lg text-xs text-secondary flex items-start gap-2">
              <IconShield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>
                To modify legal name or medical licenses, contact Clinic Administration or Healthcare Credentialing.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm"
              >
                {saving ? "Saving Changes..." : "Save Profile Details"}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Security & Password */}
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6 space-y-5">
          <div className="border-b border-outline-variant/30 pb-3 flex items-center gap-2">
            <IconLock className="w-5 h-5 text-secondary" />
            <h3 className="font-semibold text-on-surface">Security &amp; Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-10 px-3 bg-white border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-10 px-3 bg-white border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-10 px-3 bg-white border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={pwdSaving}
              className="w-full py-2.5 rounded-lg bg-surface-container hover:bg-surface-variant text-primary text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
            >
              {pwdSaving ? "Updating Password..." : "Update Password"}
            </button>
          </form>

          <div className="pt-4 border-t border-outline-variant/30 text-xs text-secondary space-y-2">
            <div className="flex items-center justify-between">
              <span>Two-Factor Authentication</span>
              <span className="text-tertiary font-semibold">Enabled (SMS)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last Login</span>
              <span className="font-mono">Today, 08:30 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
