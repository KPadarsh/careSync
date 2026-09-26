"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SearchIcon,
  RefreshIcon,
  RecordsIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
} from "./NurseIcons";

export const NursingRecordsView: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecords = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/nurse/records?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.records || []);
      }
    } catch (err) {
      console.error("Failed to load nursing records:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">Nursing Records Archive</h1>
          <p className="text-sm text-slate-500 mt-1">
            Read-focused clinical triage history, vitals audits, and immutable physician handoffs.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient, MRN, complaint..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-xs lg:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00355f]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Records</option>
            <option value="completed">Finalized</option>
            <option value="draft">Drafts</option>
          </select>
        </form>
      </div>

      {/* RECORDS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading nursing records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No nursing records match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Date &amp; Time</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Chief Assessment</th>
                  <th className="py-3.5 px-4">Vitals Profile</th>
                  <th className="py-3.5 px-4">Nurse</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((rec) => {
                  const pat = rec.patientId;
                  const patName = `${pat?.firstName || ""} ${pat?.lastName || pat?.userId?.name || "Patient"}`;
                  const isFinal = rec.status === "completed";

                  return (
                    <tr key={rec._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">
                            {new Date(rec.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(rec.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/nurse/patients/${pat?._id}`}
                            className="font-semibold text-slate-900 hover:text-[#006a61] hover:underline"
                          >
                            {patName}
                          </Link>
                          <span className="text-[11px] text-slate-500 font-mono">
                            MRN: {pat?.mrn || "N/A"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-medium text-slate-800 line-clamp-1">
                          {rec.chiefComplaint}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Obs: {rec.observations}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {rec.vitals ? (
                          <div className="flex flex-col text-[11px]">
                            <span className="font-semibold text-slate-800">
                              BP {rec.vitals.bloodPressure || "120/80"}
                            </span>
                            <span className="text-slate-500">
                              HR {rec.vitals.heartRate || 72} bpm • SpO2 {rec.vitals.oxygenSaturation || 98}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                        {rec.nurseName || "Arun Mary, RN"}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isFinal
                              ? "bg-teal-50 text-teal-800 border border-teal-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {isFinal && <CheckCircleIcon size={12} />}
                          <span>{rec.status}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right pr-6 whitespace-nowrap">
                        <Link
                          href={`/nurse/records/${rec._id}`}
                          className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-block transition-colors"
                        >
                          View Record
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
};
