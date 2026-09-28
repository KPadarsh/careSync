"use client";

import React, { useState, useEffect } from "react";
import {
  ProfileIcon,
  CheckIcon,
  AlertTriangleIcon,
} from "./LabIcons";

export const ProfileView: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lab/profile");
      if (!res.ok) {
        throw new Error("Failed to load profile");
      }
      const data = await res.json();
      setProfile(data.user);
      setName(data.user.name || "");
      setPhone(data.user.phone || "");
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
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/lab/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!res.ok) {
        throw new Error("Failed to update profile");
      }
      setMessage("Profile updated successfully.");
      await fetchProfile();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* HEADER SECTION */}
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">
          Laboratory Technologist Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Credentials, workstation certification, and departmental station assignment.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
          <CheckIcon size={16} className="text-teal-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangleIcon size={16} className="text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* CREDENTIALS CARD */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#006a68] text-white flex items-center justify-center font-bold text-xl ring-4 ring-teal-50">
            VM
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#00355f]">{profile?.name}</h2>
            <span className="text-xs text-slate-500 font-medium block">
              {profile?.certification}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-200">
                ACTIVE SHIFT
              </span>
              <span className="text-xs text-slate-400">
                License: {profile?.licenseNumber}
              </span>
            </div>
          </div>
        </div>

        {/* WORKSTATION STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Assigned Lab
            </span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {profile?.station}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Department
            </span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {profile?.department}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Working Shift
            </span>
            <span className="font-semibold text-slate-800 mt-0.5 block">
              {profile?.shift}
            </span>
          </div>
        </div>

        {/* EDIT PROFILE FORM */}
        <form onSubmit={handleSave} className="flex flex-col gap-4 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-sm text-[#00355f]">Personal &amp; Contact Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Email Address (System Login)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ""}
                className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#00355f] hover:bg-[#0f4c81] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
