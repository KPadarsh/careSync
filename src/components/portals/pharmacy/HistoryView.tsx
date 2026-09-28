"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HistoryIcon,
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  RefreshIcon,
  PrinterIcon,
} from "./PharmacyIcons";

export function HistoryView() {
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalDispensed: 0, totalMedicationUnits: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeFilter, setRangeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/pharmacy/history", window.location.origin);
      if (rangeFilter !== "all") url.searchParams.set("range", rangeFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load dispensing history");
      const data = await res.json();
      setRecords(data.records || []);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [rangeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
              DISPENSARY AUDIT LOG
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Completed Dispensing Registry
          </h1>
          <p className="text-sm text-slate-400">
            Archived records of completed prescription dispenses, batch lot tracking, and pharmacist signatures.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshIcon className="w-4 h-4 text-teal-400" />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Prescriptions Dispensed
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">
              {stats.totalDispensed}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Medication Units Dispensed
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1">
              {stats.totalMedicationUnits}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <HistoryIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0A1324] border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "all", label: "All Time" },
            { id: "today", label: "Today" },
            { id: "week", label: "Past 7 Days" },
            { id: "month", label: "Past 30 Days" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRangeFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                rangeFilter === tab.id
                  ? "bg-teal-600 text-white font-semibold shadow-md shadow-teal-950/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search dispense ID, patient, medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            <SearchIcon className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Records Table */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
            Loading history records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No completed dispensing records found in this range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08101E] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Dispense Ref</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Prescriber</th>
                  <th className="px-5 py-3.5">Dispensed Medication Items</th>
                  <th className="px-5 py-3.5">Dispensing Pharmacist</th>
                  <th className="px-5 py-3.5">Dispensed Timestamp</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {records.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-slate-900/40 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-teal-400 bg-teal-950/50 px-2 py-0.5 rounded border border-teal-800/50 text-[11px]">
                        {r.dispenseId}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-white group-hover:text-teal-300 transition-colors text-sm">
                        {r.patientId?.name || "Patient"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        MRN: {r.patientId?.mrn || "MRN-0000"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">
                        Dr. {r.doctorId?.name || "Doctor"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {r.doctorId?.specialty}
                      </div>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <div className="space-y-1">
                        {r.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-200 font-medium">
                              {item.medicineName}
                            </span>
                            <span className="text-teal-400 font-bold ml-2">
                              {item.quantityDispensed} {item.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-300 font-medium">
                      {r.pharmacistName}
                    </td>

                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(r.dispensedDate || r.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/pharmacy/dispensing/${r._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white font-semibold text-xs transition-colors"
                      >
                        <span>View</span>
                        <span>→</span>
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
