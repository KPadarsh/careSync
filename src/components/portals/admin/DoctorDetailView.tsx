"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  ArrowLeftIcon,
  DoctorsIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  EditIcon,
  RefreshIcon,
  BuildingIcon,
  ClockIcon,
} from "./AdminShell";

interface DoctorDetailViewProps {
  id: string;
}

export function DoctorDetailView({ id }: DoctorDetailViewProps) {
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    specialty: "",
    department: "",
    qualification: "",
    roomNumber: "",
    startTime: "",
    endTime: "",
    slotDurationMinutes: 30,
    password: "",
  });

  // Manual Password Assignment State
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fetchDoctor = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/doctors/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Doctor profile not found");
      }
      setDoctor(data.doctor);
      setEditForm({
        name: data.doctor.name || "",
        specialty: data.doctor.specialty || "",
        department: data.doctor.department || "",
        qualification: data.doctor.qualification || "",
        roomNumber: data.doctor.roomNumber || "",
        startTime: data.doctor.workingHours?.start || "09:00 AM",
        endTime: data.doctor.workingHours?.end || "05:00 PM",
        slotDurationMinutes: data.doctor.slotDurationMinutes || 30,
        password: "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load doctor profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctor();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!doctor) return;
    const newStatus = doctor.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/doctors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDoctor(data.doctor);
        setSuccess(`Doctor status updated to ${newStatus}`);
        setError(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to update doctor status");
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      setError(err.message || "Failed to update status");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }
    setResettingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await fetch(`/api/admin/doctors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update doctor password");
      }
      setPasswordSuccess("Doctor password updated successfully. Active sessions revoked.");
      setNewPassword("");
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, any> = {
        name: editForm.name,
        specialty: editForm.specialty,
        department: editForm.department,
        qualification: editForm.qualification,
        roomNumber: editForm.roomNumber,
        workingHours: {
          start: editForm.startTime,
          end: editForm.endTime,
        },
        slotDurationMinutes: editForm.slotDurationMinutes,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      const res = await fetch(`/api/admin/doctors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setDoctor(data.doctor);
        setIsEditing(false);
        setSuccess("Doctor profile updated successfully");
        setError(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to update doctor profile");
      }
    } catch (err: any) {
      console.error("Error saving doctor edits:", err);
      setError(err.message || "Failed to save edits");
    }
  };

  if (loading) {
    return (
      <AdminShell activeKey="doctors">
        <div className="p-12 text-center text-slate-400">Loading doctor profile...</div>
      </AdminShell>
    );
  }

  if (error || !doctor) {
    return (
      <AdminShell activeKey="doctors">
        <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
          <AlertTriangleIcon className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Doctor Profile Not Found</h2>
          <p className="text-sm text-slate-500">{error || "Requested doctor does not exist."}</p>
          <Link
            href="/admin/doctors"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Doctors Registry
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeKey="doctors">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/doctors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Doctors Registry
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
            >
              <EditIcon className="w-3.5 h-3.5 text-slate-500" />
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </button>
            <button
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                doctor.status === "active"
                  ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {doctor.status === "active" ? "Set Inactive" : "Set Active"}
            </button>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm">
            <AlertTriangleIcon className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Doctor Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700">
              DR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{doctor.name}</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    doctor.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {doctor.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {doctor.specialty} • {doctor.qualification}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                Department: {doctor.department} • Room: {doctor.roomNumber}
              </div>
            </div>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Edit Physician Profile
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Physician Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Specialty
                </label>
                <input
                  type="text"
                  value={editForm.specialty}
                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Qualifications
                </label>
                <input
                  type="text"
                  value={editForm.qualification}
                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Consultation Room / Suite
                </label>
                <input
                  type="text"
                  value={editForm.roomNumber}
                  onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Slot Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={editForm.slotDurationMinutes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, slotDurationMinutes: parseInt(e.target.value) || 30 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Working Hours Start
                </label>
                <input
                  type="text"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Working Hours End
                </label>
                <input
                  type="text"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Reset Account Password (Optional)
              </label>
              <input
                type="text"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Leave blank to keep existing password unchanged"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Enter at least 8 characters if you wish to reset this physician's password now.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Consultation Facility Placement
              </h2>
              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-400 block">Department:</span>
                  <span className="text-slate-800 font-medium">{doctor.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Suite:</span>
                  <span className="text-slate-800 font-medium">{doctor.roomNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Appointment Slot Duration:</span>
                  <span className="text-slate-800 font-medium">
                    {doctor.slotDurationMinutes || 30} minutes
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Operating Schedule & Availability
              </h2>
              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-400 block">Working Hours:</span>
                  <span className="text-slate-800 font-medium">
                    {doctor.workingHours?.start || "09:00 AM"} - {doctor.workingHours?.end || "05:00 PM"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Available Days:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {doctor.availableDays?.map((d: string) => (
                      <span
                        key={d}
                        className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-medium rounded text-[11px]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Account Access & Password Management Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Account Security & Login Password
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Admin Manual Password Assignment
                </span>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
                  <AlertTriangleIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p>
                    <strong>Doctor Login Email:</strong> <span className="font-mono text-slate-800">{doctor.email}</span>
                  </p>
                  <p>
                    Admin can directly assign or reset the password for this physician at any time. When updated, active sessions will be terminated and the doctor can immediately log in with the new password.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <div className="relative w-full sm:w-64">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8)..."
                      className="w-full px-3 py-2 pr-16 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-500 hover:text-slate-800 px-1 py-0.5"
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={resettingPassword || !newPassword}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition shadow-sm"
                  >
                    {resettingPassword ? "Updating..." : "Set New Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
          <ClockIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Strict Scope Compliance:</strong> This administrative portal governs doctor shift
            availability, room assignments, and departmental affiliation. All medical records, clinical notes,
            and patient appointments are strictly isolated to the Clinical Doctor Portal.
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
