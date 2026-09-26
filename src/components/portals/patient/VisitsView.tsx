"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface VisitItem {
  _id: string;
  visitDate: string;
  reason: string;
  diagnosis: string;
  summary: string;
  status: string;
  doctorId?: {
    name: string;
    specialty: string;
    department: string;
    roomNumber: string;
    avatar?: string;
  };
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    weightKg?: number;
  };
}

export function VisitsView() {
  const [visits, setVisits] = useState<VisitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "completed">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/patient/visits")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.visits) {
          setVisits(data.visits);
        }
      })
      .catch((err) => console.error("Error loading visits:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredVisits = visits.filter((v) => {
    if (filter === "completed" && v.status !== "completed") return false;
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchDoc = v.doctorId?.name?.toLowerCase().includes(term);
      const matchReason = v.reason?.toLowerCase().includes(term);
      const matchDiag = v.diagnosis?.toLowerCase().includes(term);
      return matchDoc || matchReason || matchDiag;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">My Visits</h2>
          <p className="text-sm text-[#45464d] mt-1">
            Clinical visit history, physician diagnoses, and encounter summaries.
          </p>
        </div>
        <Link
          href="/patient/appointments"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#131b2e] text-white text-sm font-semibold rounded-lg hover:bg-[#213145] transition-colors cursor-pointer self-start sm:self-auto"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Book Consultation
        </Link>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-[#131b2e] text-white"
                : "bg-[#eff4ff] text-[#45464d] hover:text-[#0b1c30]"
            }`}
          >
            All Encounters ({visits.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("completed")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === "completed"
                ? "bg-[#131b2e] text-white"
                : "bg-[#eff4ff] text-[#45464d] hover:text-[#0b1c30]"
            }`}
          >
            Completed
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#45464d]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by doctor or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#eff4ff] border-none rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0b1c30] placeholder:text-[#45464d] focus:outline-none focus:ring-1 focus:ring-[#131b2e]"
          />
        </div>
      </div>

      {/* Visits List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-[#e2e8f0] animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-16 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#006a61] mx-auto flex items-center justify-center mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[#0b1c30]">No visits found</h3>
          <p className="text-xs text-[#45464d] max-w-sm mx-auto mt-1 mb-4">
            You do not have any recorded medical visits matching the selected filter.
          </p>
          <Link
            href="/patient/appointments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#131b2e] text-white text-xs font-semibold rounded-lg hover:bg-[#213145] transition-colors"
          >
            Schedule a Visit
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm hover:border-[#131b2e]/30 transition-all p-6 space-y-4"
            >
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#e2e8f0] gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#131b2e] font-bold text-sm">
                    {item.doctorId?.name
                      ? item.doctorId.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                      : "DR"}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0b1c30]">
                      {item.doctorId?.name || "Consulting Physician"}
                    </h4>
                    <p className="text-xs text-[#45464d]">
                      {item.doctorId?.specialty || "General Medicine"} • {item.doctorId?.roomNumber || "Main Clinic"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[#45464d] flex items-center gap-1.5">
                    <svg className="h-4 w-4 text-[#006a61]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {new Date(item.visitDate).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#22c55e]/10 text-[#22c55e] capitalize">
                    {item.status}
                  </span>
                </div>
              </div>

              {/* Visit Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#eff4ff]/50 rounded-lg p-3.5">
                  <p className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider mb-1">
                    Reason for Visit
                  </p>
                  <p className="text-xs font-medium text-[#0b1c30]">{item.reason}</p>
                </div>
                <div className="bg-[#eff4ff]/50 rounded-lg p-3.5">
                  <p className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider mb-1">
                    Clinical Diagnosis
                  </p>
                  <p className="text-xs font-medium text-[#0b1c30]">{item.diagnosis}</p>
                </div>
              </div>

              {/* Patient-accessible Summary */}
              <div>
                <p className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider mb-1.5">
                  Physician Consultation Summary
                </p>
                <p className="text-xs text-[#0b1c30] leading-relaxed bg-[#f8fafc] border border-[#e2e8f0] p-3 rounded-lg">
                  {item.summary}
                </p>
              </div>

              {/* Vitals Recorded */}
              {item.vitals && (
                <div className="pt-2 border-t border-[#e2e8f0]/60">
                  <p className="text-[11px] font-semibold text-[#45464d] uppercase tracking-wider mb-2">
                    Recorded Vitals
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.vitals.bloodPressure && (
                      <span className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded text-xs font-medium text-[#0b1c30]">
                        BP: <strong className="font-bold">{item.vitals.bloodPressure}</strong> mmHg
                      </span>
                    )}
                    {item.vitals.heartRate && (
                      <span className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded text-xs font-medium text-[#0b1c30]">
                        Pulse: <strong className="font-bold">{item.vitals.heartRate}</strong> bpm
                      </span>
                    )}
                    {item.vitals.temperature && (
                      <span className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded text-xs font-medium text-[#0b1c30]">
                        Temp: <strong className="font-bold">{item.vitals.temperature}°F</strong>
                      </span>
                    )}
                    {item.vitals.oxygenSaturation && (
                      <span className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded text-xs font-medium text-[#0b1c30]">
                        SpO₂: <strong className="font-bold">{item.vitals.oxygenSaturation}%</strong>
                      </span>
                    )}
                    {item.vitals.weightKg && (
                      <span className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded text-xs font-medium text-[#0b1c30]">
                        Weight: <strong className="font-bold">{item.vitals.weightKg}</strong> kg
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
