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

export function CreateStaffView() {
  const router = useRouter();
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "nurse",
    department: "",
    designation: "",
    shift: "Morning (08:00 - 16:00)",
    emergencyContact: "",
    qualifications: "",
    notes: "",
    password: "Password123!",
  });

  useEffect(() => {
    fetch("/api/admin/departments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.departments?.length > 0) {
          const names = data.departments.map((d: any) => d.name);
          setDepartments(names);
          setForm((f) => ({ ...f, department: names[0] || "General Medicine" }));
        } else {
          setDepartments([
            "Cardiology",
            "General Medicine",
            "Pediatrics",
            "Orthopedics",
            "Dermatology",
            "Pathology & Laboratory",
            "Central Pharmacy",
            "Finance & Accounts",
          ]);
          setForm((f) => ({ ...f, department: "General Medicine" }));
        }
      })
      .catch(() => {
        setDepartments([
          "Cardiology",
          "General Medicine",
          "Pediatrics",
          "Orthopedics",
          "Dermatology",
          "Pathology & Laboratory",
          "Central Pharmacy",
          "Finance & Accounts",
        ]);
        setForm((f) => ({ ...f, department: "General Medicine" }));
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create staff member");
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
                  placeholder="e.g. Arun Mary"
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
                  placeholder="e.g. arun.mary@nurse.caresync.com"
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
                  <option value="receptionist">Receptionist (Front Desk)</option>
                  <option value="nurse">Nurse (Inpatient & Triage)</option>
                  <option value="lab_technician">Lab Technician (Clinical Laboratory)</option>
                  <option value="pathologist">Pathologist (Diagnostic Reviews)</option>
                  <option value="pharmacist">Pharmacist (Formulary Dispensing)</option>
                  <option value="billing_staff">Billing Staff (Accounts Receivable)</option>
                  <option value="administrator">System Administrator</option>
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
