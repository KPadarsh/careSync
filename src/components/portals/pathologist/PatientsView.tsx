"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PatientsIcon,
  SearchIcon,
  RefreshCwIcon,
} from "./PathologistIcons";

export function PatientsView() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/pathologist/patients?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to load patient pathology records.");
      const json = await res.json();
      setPatients(json.patients || []);
    } catch (err: any) {
      setError(err.message || "Failed to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002444] tracking-tight">
            Patient Pathology Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Longitudinal diagnostic lab history, cumulative test panels, and abnormal flag tracking.
          </p>
        </div>

        <button
          onClick={fetchPatients}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#00355f] text-xs font-semibold shadow-sm self-start sm:self-auto"
        >
          <RefreshCwIcon className="w-4 h-4 text-slate-500" />
          <span>Refresh Roster</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name, MRN, contact number..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Aggregating patient pathology profiles...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs">{error}</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <PatientsIcon className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No patients found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Patient</th>
                  <th className="py-3.5 px-4">MRN</th>
                  <th className="py-3.5 px-4">Gender / Blood</th>
                  <th className="py-3.5 px-4">Total Requisitions</th>
                  <th className="py-3.5 px-4">Verified Reports</th>
                  <th className="py-3.5 px-4">Pending Review</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {p.mrn}
                    </td>
                    <td className="py-3.5 px-4 capitalize text-slate-700">
                      {p.gender} • {p.bloodGroup}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {p.totalReports} tests
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {p.verifiedReports} certified
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.pendingReports > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {p.pendingReports} awaiting
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None pending</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <Link
                        href={`/pathologist/patients/${p.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00355f] text-white hover:bg-[#002444] text-xs font-semibold shadow-sm transition-all"
                      >
                        <span>Cumulative History</span>
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
