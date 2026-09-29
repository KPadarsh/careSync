"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  DepartmentsIcon,
  SearchIcon,
  PlusIcon,
  RefreshIcon,
  ChevronRightIcon,
  BuildingIcon,
  DoctorsIcon,
  StaffIcon,
} from "./AdminShell";

interface DepartmentItem {
  _id: string;
  name: string;
  code: string;
  description: string;
  headOfDepartment: string;
  location: string;
  phone: string;
  status: "active" | "inactive";
  doctorsCount?: number;
  staffCount?: number;
}

export function DepartmentsListView() {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/departments?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments || []);
      }
    } catch (err) {
      console.error("Error loading departments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDepartments();
  };

  return (
    <AdminShell activeKey="departments">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Clinical & Administrative Departments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Facility wings, specialized medical divisions, assigned staff headcounts, and location management.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDepartments}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/admin/departments/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              New Department
            </Link>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search departments, codes, locations..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <div className="flex items-center gap-2 text-xs text-slate-600 w-full sm:w-auto">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Department Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Loading departments...
          </div>
        ) : departments.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <DepartmentsIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No departments found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Add a new facility division or adjust your search filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.map((dept) => (
              <div
                key={dept._id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-200 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {dept.code}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        dept.status === "active"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {dept.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    <Link href={`/admin/departments/${dept._id}`} className="hover:text-indigo-600">
                      {dept.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description}</p>

                  <div className="text-xs text-slate-600 space-y-1.5 mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <BuildingIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{dept.location}</span>
                    </div>
                    <div className="text-slate-500">
                      Head: <span className="font-medium text-slate-800">{dept.headOfDepartment || "None"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1" title="Assigned Doctors">
                      <DoctorsIcon className="w-3.5 h-3.5 text-indigo-500" />
                      <strong>{dept.doctorsCount || 0}</strong> Docs
                    </span>
                    <span className="flex items-center gap-1" title="Assigned Staff">
                      <StaffIcon className="w-3.5 h-3.5 text-blue-500" />
                      <strong>{dept.staffCount || 0}</strong> Staff
                    </span>
                  </div>

                  <Link
                    href={`/admin/departments/${dept._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Details
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
