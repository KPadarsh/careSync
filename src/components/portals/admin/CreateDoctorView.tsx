"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AdminShell,
  ArrowLeftIcon,
  DoctorsIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "./AdminShell";

export function CreateDoctorView() {
  const router = useRouter();
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    specialty: "General Medicine",
    department: "General Medicine",
    qualification: "MD, MBBS",
    roomNumber: "Consultation Suite 300",
    availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    startTime: "09:00 AM",
    endTime: "05:00 PM",
    slotDurationMinutes: 30,
    password: "Doctor123!",
  });

  const allWeekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    fetch("/api/admin/departments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.departments?.length > 0) {
          const names = data.departments.map((d: any) => d.name);
          setDepartments(names);
          setForm((f) => ({ ...f, department: f.department || names[0] || "General Medicine" }));
        } else {
          const fallback = ["Cardiology", "General Medicine", "Pediatrics", "Orthopedics", "Dermatology"];
          setDepartments(fallback);
        }
      })
      .catch(() => {
        const fallback = ["Cardiology", "General Medicine", "Pediatrics", "Orthopedics", "Dermatology"];
        setDepartments(fallback);
      });
  }, []);

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const exists = prev.availableDays.includes(day);
      return {
        ...prev,
        availableDays: exists
          ? prev.availableDays.filter((d) => d !== day)
          : [...prev.availableDays, day],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        specialty: form.specialty.trim() || form.department.trim(),
        department: form.department.trim(),
        qualification: form.qualification.trim(),
        roomNumber: form.roomNumber.trim(),
        availableDays: form.availableDays,
        workingHours: {
          start: form.startTime,
          end: form.endTime,
        },
        slotDurationMinutes: Number(form.slotDurationMinutes),
        password: form.password,
      };

      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create doctor profile");
      }

      router.push(`/admin/doctors/${data.doctor._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to save doctor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell activeKey="doctors">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/doctors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Doctors Directory
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Register Physician Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure physician specialty, clinic room placement, and patient consultation availability.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
            <AlertTriangleIcon className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          {/* Section 1: Doctor Basic Info */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <DoctorsIcon className="w-4 h-4 text-indigo-600" />
              Physician Identification
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name with Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Doctor Login Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. rajesh@doctor.caresync.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Medical Specialty *
                </label>
                <input
                  type="text"
                  required
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  placeholder="e.g. Cardiology, Electrophysiology"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assigned Department *
                </label>
                <select
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Academic Qualifications
                </label>
                <input
                  type="text"
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  placeholder="e.g. MD, DM (Cardiology), FACC"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Consultation Room / Clinic Suite
                </label>
                <input
                  type="text"
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                  placeholder="e.g. Cardiology Wing, Room 405"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Availability Schedule */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Weekly Consultation Hours & Days
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
                Available Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {allWeekdays.map((day) => {
                  const selected = form.availableDays.includes(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        selected
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Shift Start Time
                </label>
                <input
                  type="text"
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  placeholder="09:00 AM"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Shift End Time
                </label>
                <input
                  type="text"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  placeholder="05:00 PM"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Slot Duration (Minutes)
                </label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={form.slotDurationMinutes}
                  onChange={(e) => setForm({ ...form, slotDurationMinutes: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Physician Login Credentials & Password Assignment */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Doctor Portal Login Credentials
              </span>
              <span className="text-xs font-normal text-slate-500">
                Doctor will log in using these credentials
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assign Account Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Doctor123!"
                    className="w-full px-3 py-2 pr-16 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-800 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Minimum 8 characters. Admin can manually assign any custom password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Doctor Login Email
                </label>
                <input
                  type="text"
                  disabled
                  value={form.email || "Enter doctor email above"}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Doctor will use their email and this password to sign in at <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">/login</code>.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/admin/doctors"
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              {loading ? "Registering..." : "Save Physician Profile"}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
