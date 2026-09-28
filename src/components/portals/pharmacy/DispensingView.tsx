"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  DispensingIcon,
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  PrinterIcon,
} from "./PharmacyIcons";

export function DispensingView() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/pharmacy/dispensing", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load dispensing records");
      const data = await res.json();
      setRecords(data.dispensingRecords || []);
    } catch (err: any) {
      setError(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "preparing":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Preparing</span>
          </span>
        );
      case "dispensed":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
            Dispensed
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
              DISPENSARY EXECUTION WORKFLOW
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dispensing Counter
          </h1>
          <p className="text-sm text-slate-400">
            Fulfill verified prescriptions, manage drug labeling, and record completed dispenses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pharmacy/prescriptions?status=ready"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-900/30 transition-all hover:scale-102"
          >
            <DispensingIcon className="w-4 h-4" />
            <span>Fulfill Ready Queue</span>
          </Link>
        </div>
      </div>

      {/* Workflow Step Tracker Visual */}
      <div className="bg-[#0A1324] border border-slate-800/80 p-4 rounded-2xl">
        <div className="flex items-center justify-between overflow-x-auto text-[11px] font-semibold text-slate-400 min-w-[500px]">
          <div className="flex items-center gap-2 text-teal-400">
            <span className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500 flex items-center justify-center text-xs font-bold text-teal-300">
              1
            </span>
            <span>Doctor Prescription</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-2 text-teal-400">
            <span className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500 flex items-center justify-center text-xs font-bold text-teal-300">
              2
            </span>
            <span>Review & Stock Check</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-2 text-amber-400">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-xs font-bold text-amber-300">
              3
            </span>
            <span>Prepare & Label</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-300">
              4
            </span>
            <span>Dispense & Record</span>
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
              5
            </span>
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#0A1324] border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "all", label: "All Records" },
            { id: "preparing", label: "Preparing" },
            { id: "dispensed", label: "Dispensed" },
            { id: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === tab.id
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
              placeholder="Search dispense ID, patient..."
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

      {/* Dispensing Records List */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
            Loading dispensing records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No dispensing records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08101E] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Dispense Ref</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Prescribed By</th>
                  <th className="px-5 py-3.5">Medicines Dispensed</th>
                  <th className="px-5 py-3.5">Pharmacist</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
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
                      <div className="font-bold text-white text-sm">
                        {r.patientId?.name || "Patient"}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {r.patientId?.mrn || "MRN-0000"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">
                        Dr. {r.doctorId?.name || "Doctor"}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {r.doctorId?.specialty}
                      </span>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <div className="space-y-1">
                        {r.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-200 font-medium">
                              {item.medicineName}
                            </span>
                            <span className="text-teal-400 font-bold ml-2">
                              x{item.quantityDispensed} {item.unit}
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
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(r.status)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/pharmacy/dispensing/${r._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white font-semibold text-xs transition-colors"
                      >
                        <span>Inspect</span>
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
