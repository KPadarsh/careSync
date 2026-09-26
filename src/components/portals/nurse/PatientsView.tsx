"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  SearchIcon,
  RefreshIcon,
  UserIcon,
  VitalsIcon,
  AssessmentIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
} from "./NurseIcons";

export const PatientsView: React.FC = () => {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatients = async (query = "") => {
    try {
      setRefreshing(true);
      const url = query ? `/api/nurse/patients?search=${encodeURIComponent(query)}` : `/api/nurse/patients`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setPatients(json.patients || []);
      }
    } catch (err) {
      console.error("Failed to load patients:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPatients(initialSearch);
  }, [initialSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients(search);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">Clinic Patients</h1>
          <p className="text-sm text-slate-500 mt-1">
            Active patient directory, triage clinical records, and baseline history.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, MRN, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-xs lg:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00355f] shadow-xs"
          />
        </form>
      </div>

      {/* PATIENT DIRECTORY TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading clinic directory...</div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No patients found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Patient Name &amp; MRN</th>
                  <th className="py-3.5 px-4">Demographics</th>
                  <th className="py-3.5 px-4">Blood Group</th>
                  <th className="py-3.5 px-4">Allergies</th>
                  <th className="py-3.5 px-4">Latest Vitals</th>
                  <th className="py-3.5 px-4">Queue Status</th>
                  <th className="py-3.5 px-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((pat) => {
                  const fullName = `${pat.firstName || ""} ${pat.lastName || pat.userId?.name || "Patient"}`;
                  const hasAllergies = pat.allergies && pat.allergies.length > 0;
                  const vitals = pat.latestVitals;
                  const activeQueue = pat.activeQueue;

                  return (
                    <tr key={pat._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/nurse/patients/${pat._id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-[#006a61] hover:underline"
                          >
                            {fullName}
                          </Link>
                          <span className="text-[11px] text-slate-500 font-mono">
                            MRN: {pat.mrn || "N/A"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        {pat.gender || "M"} • {pat.phone || "No phone"}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs">
                          {pat.bloodGroup || "O+"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {hasAllergies ? (
                          <div className="flex flex-wrap gap-1">
                            {pat.allergies.map((alg: string) => (
                              <span
                                key={alg}
                                className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold"
                              >
                                {alg}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">NKDA</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {vitals ? (
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">
                              BP {vitals.bloodPressure || "120/80"}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              HR {vitals.heartRate || 72} bpm • SpO2 {vitals.oxygenSaturation || 98}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No recent vitals</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {activeQueue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-semibold">
                            <span>{activeQueue.ticketNumber}</span>
                            <span className="text-teal-600 capitalize">• {activeQueue.status.replace("-", " ")}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Not in queue</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/nurse/vitals/${pat._id}`}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                          >
                            Vitals
                          </Link>
                          <Link
                            href={`/nurse/patients/${pat._id}`}
                            className="px-3 py-1 rounded bg-[#00355f] hover:bg-[#0f4c81] text-white text-xs font-semibold"
                          >
                            Chart
                          </Link>
                        </div>
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
