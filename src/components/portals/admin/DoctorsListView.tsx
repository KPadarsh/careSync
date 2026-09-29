"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  DoctorsIcon,
  SearchIcon,
  PlusIcon,
  RefreshIcon,
  ChevronRightIcon,
  ClockIcon,
} from "./AdminShell";

interface DoctorItem {
  _id: string;
  name: string;
  specialty: string;
  department: string;
  qualification: string;
  roomNumber: string;
  availableDays: string[];
  workingHours: {
    start: string;
    end: string;
  };
  slotDurationMinutes: number;
  status: "active" | "on_leave" | "inactive";
}

export function DoctorsListView() {
  const [doctors, setDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (deptFilter !== "all") params.append("department", deptFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/doctors?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.doctors || []);
      }
    } catch (err) {
      console.error("Error loading doctors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [deptFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <AdminShell activeKey="doctors">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Physician & Specialist Registry
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage physician credentials, departmental placement, consultation rooms, and clinic availability hours.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDoctors}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/admin/doctors/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Physician Profile
            </Link>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by physician name, specialty, room..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Department:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Departments</option>
                <option value="Cardiology">Cardiology</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Doctors Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading physician profiles...</div>
          ) : doctors.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <DoctorsIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No doctor profiles found</h3>
              <p className="text-sm text-slate-500 mt-1">
                Try modifying your search or register a new doctor profile.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Physician</th>
                    <th className="py-3 px-4">Specialty</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Consultation Room</th>
                    <th className="py-3 px-4">Hours & Days</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/doctors/${doc._id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600 block"
                        >
                          {doc.name}
                        </Link>
                        <div className="text-xs text-slate-400">{doc.qualification}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{doc.specialty}</td>
                      <td className="py-3.5 px-4 text-slate-600">{doc.department}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {doc.roomNumber}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <div>
                          {doc.workingHours?.start || "09:00 AM"} -{" "}
                          {doc.workingHours?.end || "05:00 PM"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {doc.availableDays?.length || 5} days/week
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            doc.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : doc.status === "on_leave"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/doctors/${doc._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Manage
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
