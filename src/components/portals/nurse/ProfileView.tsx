"use client";

import React, { useState, useEffect } from "react";
import { UserIcon, PhoneIcon, SaveIcon, CheckCircleIcon, AlertTriangleIcon } from "./NurseIcons";

export const ProfileView: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/nurse/profile");
      if (res.ok) {
        const json = await res.json();
        setProfile(json.user);
        setName(json.user.name || "");
        setPhone(json.user.phone || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess(null);
      setError(null);

      const body: any = { name, phone };
      if (newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch("/api/nurse/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to update profile");
      }

      setSuccess("Profile details saved successfully.");
      setCurrentPassword("");
      setNewPassword("");
      fetchProfile();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006a61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Nurse Profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">Staff Nurse Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Workstation credentials, registered nurse licensing, and security settings.
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
          <CheckCircleIcon size={16} className="text-teal-600" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangleIcon size={16} className="text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* NURSE IDENTITY BANNER */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#00355f] text-white flex items-center justify-center text-xl font-bold ring-2 ring-slate-100 flex-shrink-0">
          AM
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{profile?.name || "Arun Mary"}</h2>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold uppercase">
              Registered Nurse
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            License: <strong className="font-mono text-slate-800">{profile?.licenseNumber || "RN-89421-CA"}</strong> •{" "}
            {profile?.department || "Cardiology Triage"}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
            <span>Station: <strong className="text-slate-800">{profile?.station || "Triage Bay 3A"}</strong></span>
            <span>•</span>
            <span>Shift: <strong className="text-teal-700">{profile?.shift || "Day Shift"}</strong></span>
          </div>
        </div>
      </div>

      {/* EDIT PROFILE FORM */}
      <form onSubmit={handleUpdate} className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col gap-5">
        <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
          Personal &amp; Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#00355f]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={profile?.email || "arun.mary@nurse.caresync.com"}
              className="w-full h-9 px-3 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#00355f]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Registered License</label>
            <input
              type="text"
              disabled
              value={profile?.licenseNumber || "RN-89421-CA"}
              className="w-full h-9 px-3 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-mono"
            />
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-sm pt-3 pb-2 border-b border-slate-100">
          Change Workstation Password
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Current Password</label>
            <input
              type="password"
              placeholder="Leave blank if unchanged"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">New Password</label>
            <input
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#00355f] hover:bg-[#0f4c81] text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5"
          >
            <SaveIcon size={14} />
            <span>{saving ? "Saving Changes..." : "Save Profile Details"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
