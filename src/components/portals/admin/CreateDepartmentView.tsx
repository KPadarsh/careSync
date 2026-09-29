"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AdminShell,
  ArrowLeftIcon,
  DepartmentsIcon,
  AlertTriangleIcon,
} from "./AdminShell";

export function CreateDepartmentView() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    headOfDepartment: "",
    location: "Building A, 2nd Floor",
    phone: "",
    email: "",
    startTime: "08:00 AM",
    endTime: "08:00 PM",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        headOfDepartment: form.headOfDepartment.trim(),
        location: form.location.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        operatingHours: {
          start: form.startTime,
          end: form.endTime,
        },
      };

      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create department");
      }

      router.push(`/admin/departments/${data.department._id}`);
    } catch (err: any) {
      setError(err.message || "Failed to save department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell activeKey="departments">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Departments
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create Hospital Department
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Establish a clinical or administrative facility unit with operational guidelines.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm">
            <AlertTriangleIcon className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Department Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Neurology & Neurodiagnostics"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Code *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. NEURO"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Clinical scope, diagnostic capabilities, or operational focus..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Head of Department / Clinical Lead
              </label>
              <input
                type="text"
                value={form.headOfDepartment}
                onChange={(e) => setForm({ ...form, headOfDepartment: e.target.value })}
                placeholder="e.g. Dr. Rajesh Kumar"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Facility Location / Suite
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Building A, 3rd Floor"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Direct Contact Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 400-1090"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Department Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="neuro@caresync.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Operating Hours Start
              </label>
              <input
                type="text"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                placeholder="08:00 AM"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Operating Hours End
              </label>
              <input
                type="text"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                placeholder="08:00 PM"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Link
              href="/admin/departments"
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              {loading ? "Creating..." : "Save Department"}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
