"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AdminShell,
  ArrowLeftIcon,
  StaffIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "./AdminShell";

interface DeptItem {
  id: string;
  name: string;
}

const DEFAULT_DEPARTMENTS: DeptItem[] = [
  { id: "6abfd5e021e7d6f542352fe3", name: "General Medicine" },
  { id: "6aba909427482662dadd448f", name: "Cardiology" },
  { id: "6abfd5e021e7d6f542352fe4", name: "Pediatrics" },
  { id: "6abfd5e021e7d6f542352fe5", name: "Orthopedics" },
  { id: "6abfd5e021e7d6f542352fe6", name: "Dermatology" },
  { id: "6abfd5e021e7d6f542352fe7", name: "Pathology & Laboratory" },
  { id: "6abfd5e021e7d6f542352fe8", name: "Central Pharmacy" },
  { id: "6abfd5e021e7d6f542352fe9", name: "Finance & Accounts" },
];

export function CreateStaffView() {
  const router = useRouter();
  const [departments, setDepartments] = useState<DeptItem[]>(DEFAULT_DEPARTMENTS);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "RECEPTIONIST",
    department: "General Medicine",
    departmentId: "6abfd5e021e7d6f542352fe3",
    designation: "",
    shift: "Morning (07:00 - 15:00)",
    emergencyContact: "",
    qualifications: "",
    notes: "",
    password: "CareSync2026!",
  });

  useEffect(() => {
    fetch("/api/admin/departments", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.departments?.length > 0) {
          const list: DeptItem[] = data.departments.map((d: any) => ({
            id: d._id?.toString() || d.id || d.name,
            name: d.name,
          }));
          setDepartments(list);
          const current = list.find((d) => d.name === "General Medicine") || list[0];
          setForm((prev) => ({
            ...prev,
            department: current.name,
            departmentId: current.id,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorDetail = data.fieldErrors
          ? Object.entries(data.fieldErrors).map(([k, v]) => `${k}: ${v}`).join(", ")
          : data.error;
        throw new Error(errorDetail || "Failed to create staff member");
      }

      router.push(`/admin/staff/${data.staff._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to register staff profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell activeKey="staff">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb / Back */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/staff"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Staff Directory
          </Link>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Register New Staff Member
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create an official hospital personnel profile and provision linked system credentials.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
            <AlertTriangleIcon className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <StaffIcon className="w-4 h-4 text-indigo-600" />
              Personnel Details
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Staff Full Name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="e.g. staff.member@caresync.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 234-5678"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Subsystem Role *
                </label>
                <select
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="RECEPTIONIST">Receptionist (Front Desk)</option>
                  <option value="NURSE">Nurse (Inpatient & Triage)</option>
                  <option value="LAB_TECHNICIAN">Lab Technician (Clinical Laboratory)</option>
                  <option value="PATHOLOGIST">Pathologist (Diagnostic Reviews)</option>
                  <option value="PHARMACIST">Pharmacist (Formulary Dispensing)</option>
                  <option value="BILLING_STAFF">Billing Staff (Accounts Receivable)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Department & Shift Assignment */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Department & Operational Role
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assigned Department *
                </label>
                <select
                  required
                  value={form.departmentId || form.department}
                  onChange={(e) => {
                    const val = e.target.value;
                    const match = departments.find((d) => d.id === val || d.name === val);
                    setForm({
                      ...form,
                      departmentId: match ? match.id : val,
                      department: match ? match.name : val,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Job Designation / Title
                </label>
                <input
                  type="text"
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  placeholder="e.g. Senior Registered Nurse"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Default Shift
                </label>
                <select
                  value={form.shift}
                  onChange={(e) => setForm({ ...form, shift: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                  <option value="Day (08:30 - 17:00)">Day (08:30 - 17:00)</option>
                  <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                  <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                  <option value="Rotating Roster">Rotating Roster</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                  placeholder="e.g. Thomas Mary (+1 555-888-1212)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Professional Credentials & Initial Password */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Qualifications & Credentials
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Certifications & Academic Qualifications
              </label>
              <input
                type="text"
                value={form.qualifications}
                onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                placeholder="e.g. BSN, RN, BLS/ACLS Certified"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Administrative Notes
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Special notes, internal station preferences, supervisory details..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section 4: Security & Login Credentials */}
          <div className="space-y-4">
            <div className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Portal Login Credentials
              </span>
              <span className="text-xs font-normal text-slate-500">
                Staff will log in using these credentials
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
                    placeholder="CareSync2026!"
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
                  Minimum 8 characters. You can keep the default or enter a custom initial password.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Staff Login Email
                </label>
                <input
                  type="text"
                  disabled
                  value={form.email || "Enter email address above"}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Staff will use their email and this password to sign in at <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700">/login</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/admin/staff"
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              {loading ? "Registering Staff..." : "Save Personnel Record"}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
