"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  VerifiedIcon,
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
} from "./PathologistIcons";

export function VerifiedReportsView() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const fetchVerified = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (departmentFilter !== "all") params.set("department", departmentFilter);

      const res = await fetch(`/api/pathologist/verified?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load verified reports.");
      const json = await res.json();
      setReports(json.reports || []);
    } catch (err: any) {
      setError(err.message || "Failed to load verified reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVerified();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, departmentFilter]);

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <VerifiedIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Certified Pathology Archive
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002444] tracking-tight">
            Verified Diagnostic Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Read-only finalized diagnostic reports released for clinical consumption by attending physicians.
          </p>
        </div>

        <button
          onClick={fetchVerified}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#00355f] text-xs font-semibold shadow-sm self-start sm:self-auto"
        >
          <RefreshCwIcon className="w-4 h-4 text-slate-500" />
          <span>Refresh Archive</span>
        </button>
      </div>

      {/* Search & Department Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, MRN, test, certifier..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:bg-white"
          />
        </div>

        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:bg-white"
          >
            <option value="all">All Diagnostic Benches</option>
            <option value="Clinical Chemistry">Clinical Chemistry</option>
            <option value="Hematology & Coagulation">Hematology &amp; Coagulation</option>
            <option value="Clinical Endocrinology">Clinical Endocrinology</option>
            <option value="Diagnostic Microbiology">Diagnostic Microbiology</option>
          </select>
        </div>
      </div>

      {/* Verified List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading certified archive...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs">{error}</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <VerifiedIcon className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No verified reports found</p>
            <p className="text-xs text-slate-400">
              Completed reports will appear here once certified by the pathologist.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Status</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Test &amp; Department</th>
                  <th className="py-3.5 px-4">Certified Date</th>
                  <th className="py-3.5 px-4">Verifying Pathologist</th>
                  <th className="py-3.5 px-4">Diagnostic Impression</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Status */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                        CERTIFIED
                      </span>
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
                        {r.hasRevisions && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-blue-100 text-blue-700">
                            Amended
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Certified Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-900">
                        {new Date(r.verifiedDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(r.verifiedDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    {/* Verifying Pathologist */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-900 font-medium">{r.verifiedBy}</div>
                      <div className="text-[10px] text-slate-400">Board Certified Signature</div>
                    </td>

                    {/* Diagnostic Impression */}
                    <td className="py-3.5 px-4">
                      <p className="text-slate-600 line-clamp-2 max-w-sm text-[11px] italic">
                        &quot;{r.pathologistInterpretation || r.summary}&quot;
                      </p>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <Link
                        href={`/pathologist/verified/${r.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-all"
                      >
                        <span>View Certificate</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
  );
}
