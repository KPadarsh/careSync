"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PrescriptionsIcon,
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  LockIcon,
} from "./PharmacyIcons";

export function PrescriptionsView() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/pharmacy/prescriptions", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch prescriptions");
      const data = await res.json();
      setPrescriptions(data.prescriptions || []);
    } catch (err: any) {
      setError(err.message || "Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrescriptions();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Pending Review
          </span>
        );
      case "reviewed":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
            Reviewed
          </span>
        );
      case "ready":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Ready for Dispensing
          </span>
        );
      case "dispensing":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
            Dispensing in Progress
          </span>
        );
      case "completed":
      case "dispensed":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-300 border border-slate-500/20">
            Completed
          </span>
        );
      case "clarification_requested":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Clarification Requested
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
              PHYSICIAN PRESCRIPTIONS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Doctor Prescriptions Queue
          </h1>
          <p className="text-sm text-slate-400">
            Review prescriptions issued by clinic physicians and initiate dispensing.
          </p>
        </div>

        {/* Security / RBAC Banner */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 max-w-sm">
          <LockIcon className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Prescriptions are physician-authorized. Pharmacists cannot alter medicines or dosages.</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#0A1324] border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "all", label: "All" },
            { id: "pending", label: "Pending" },
            { id: "ready", label: "Ready to Dispense" },
            { id: "dispensing", label: "Dispensing" },
            { id: "completed", label: "Completed" },
            { id: "clarification_requested", label: "Clarification" },
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

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient or medicine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <SearchIcon className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Prescription List Table */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
            Loading prescriptions...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">
            {error}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No prescriptions matching selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08101E] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Prescribing Physician</th>
                  <th className="px-5 py-3.5">Prescribed Medicines</th>
                  <th className="px-5 py-3.5">Date Issued</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {prescriptions.map((rx) => (
                  <tr
                    key={rx._id}
                    className="hover:bg-slate-900/40 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-white group-hover:text-teal-300 transition-colors text-sm">
                        {rx.patientId?.name || "Patient"}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-300">
                          {rx.patientId?.mrn || "MRN-0000"}
                        </span>
                        <span>{rx.patientId?.gender || "Unknown"}</span>
                        <span>• Blood: {rx.patientId?.bloodGroup || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-200">
                        Dr. {rx.doctorId?.name || "Physician"}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {rx.doctorId?.specialty || "General Medicine"}
                      </div>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <div className="flex flex-wrap gap-1.5">
                        {rx.medications?.map((m: any, idx: number) => (
                          <span
                            key={idx}
                            className="inline-block px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-200 text-[11px] font-medium"
                          >
                            {m.medicine} ({m.dosage})
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-300 font-mono text-[11px]">
                      {new Date(rx.date || rx.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(rx.status)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/pharmacy/prescriptions/${rx._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white font-semibold text-xs border border-teal-500/30 transition-all hover:scale-102"
                      >
                        <span>Review</span>
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
