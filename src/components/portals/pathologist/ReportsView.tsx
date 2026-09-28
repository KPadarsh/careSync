"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ReportsIcon,
  SearchIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  ClockIcon,
  MicroscopeIcon,
} from "./PathologistIcons";

export function ReportsView() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (departmentFilter !== "all") params.set("department", departmentFilter);

      const res = await fetch(`/api/pathologist/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load reports queue.");
      const json = await res.json();
      setReports(json.reports || []);
    } catch (err: any) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter, priorityFilter, departmentFilter]);

  const handleStatusChange = (val: string) => {
    setStatusFilter(val);
  };

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002444] tracking-tight">
            Diagnostic Requisitions Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Displaying doctor-created orders and technician submitted results awaiting clinical pathologist review.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#00355f] text-xs font-semibold shadow-sm self-start sm:self-auto"
        >
          <RefreshCwIcon className="w-4 h-4 text-slate-500" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <button
            onClick={() => handleStatusChange("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === "all"
                ? "bg-[#00355f] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Active Queue
          </button>
          <button
            onClick={() => handleStatusChange("submitted_for_review")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === "submitted_for_review"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Submitted for Review
          </button>
          <button
            onClick={() => handleStatusChange("under_review")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === "under_review"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Under Review
          </button>
          <button
            onClick={() => handleStatusChange("correction_required")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === "correction_required"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Correction Required
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, MRN, test, sample ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:bg-white transition-all"
            />
          </div>

          {/* Priority filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="stat">STAT Only (Urgent Emergency)</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          {/* Department filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:bg-white"
            >
              <option value="all">All Diagnostic Benches</option>
              <option value="Clinical Chemistry">Clinical Chemistry</option>
              <option value="Hematology & Coagulation">Hematology &amp; Coagulation</option>
              <option value="Clinical Endocrinology">Clinical Endocrinology</option>
              <option value="Diagnostic Microbiology">Diagnostic Microbiology</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Filtering requisition items...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs">{error}</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <ReportsIcon className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No matching reports found</p>
            <p className="text-xs text-slate-400">
              Try adjusting your search criteria or priority filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Priority</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Test &amp; Department</th>
                  <th className="py-3.5 px-4">Lab Technician</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r: any) => {
                  const isStat = r.priority === "stat";
                  const isUrgent = r.priority === "urgent";

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isStat ? "bg-rose-50/25" : ""
                      }`}
                    >
                      {/* Priority */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        {isStat ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                            STAT
                          </span>
                        ) : isUrgent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            URGENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            ROUTINE
                          </span>
                        )}
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{r.patient.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {r.patient.mrn} • {r.patient.gender}
                        </div>
                      </td>

                      {/* Test & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 max-w-xs truncate">
                          {r.testName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>{r.department}</span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-600">{r.sampleId}</span>
                        </div>
                      </td>

                      {/* Lab Technician */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-900 font-medium">{r.submittedBy}</div>
                        <div className="text-[11px] text-slate-500">Phlebotomy / Lab Bench</div>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-900">
                          {new Date(r.submittedForReviewAt).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(r.submittedForReviewAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {r.status === "under_review" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Under Review
                          </span>
                        ) : r.status === "correction_required" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Correction Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Submitted for Review
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <Link
                          href={`/pathologist/reports/${r.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00355f] text-white hover:bg-[#002444] text-xs font-semibold shadow-sm transition-all"
                        >
                          <span>Review &amp; Certify</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
