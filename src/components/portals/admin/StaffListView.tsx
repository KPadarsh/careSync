"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  StaffIcon,
  SearchIcon,
  PlusIcon,
  FilterIcon,
  RefreshIcon,
  ChevronRightIcon,
  BuildingIcon,
  ClockIcon,
} from "./AdminShell";

interface StaffMember {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  designation: string;
  shift: string;
  status: "active" | "inactive" | "on_leave";
  joinedDate: string;
}

export function StaffListView() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/staff?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff || []);
      }
    } catch (err) {
      console.error("Error loading staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff();
  };

  return (
    <AdminShell activeKey="staff">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Hospital Personnel & Staff Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Active directory of receptionists, nurses, lab technicians, pathologists, pharmacists, and billing staff.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStaff}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/admin/staff/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Staff Member
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
              placeholder="Search by name, ID, email, title..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value="receptionist">Receptionist</option>
                <option value="nurse">Nurse</option>
                <option value="lab_technician">Lab Technician</option>
                <option value="pathologist">Pathologist</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="billing_staff">Billing Staff</option>
                <option value="administrator">Administrator</option>
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
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading staff records...</div>
          ) : staff.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <StaffIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No staff records found</h3>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting your search criteria or register a new staff member.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Employee ID</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Shift</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/staff/${s._id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600"
                        >
                          {s.fullName}
                        </Link>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {s.employeeId}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-medium text-slate-700">
                          {s.role.replace("_", " ")}
                        </span>
                        <div className="text-xs text-slate-400">{s.designation}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{s.department}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{s.shift}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            s.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : s.status === "inactive"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {s.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/staff/${s._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Details
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
