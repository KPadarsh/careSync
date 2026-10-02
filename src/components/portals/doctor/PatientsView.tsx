"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchIcon, ChevronRightIcon, StethoscopeIcon } from "./DoctorIcons";

interface PatientItem {
  _id: string;
  name: string;
  mrn: string;
  gender: string;
  age: number;
  bloodGroup: string;
  phone: string;
  email: string;
  avatar?: string;
  allergies: string[];
  lastVisitDate: string;
  lastDiagnosis: string;
  activePrescriptionsCount: number;
  primaryDoctor: string;
}

export const PatientsView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState("all");

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (filter !== "all") params.set("filter", filter);

      const res = await fetch(`/api/doctor/patients?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error("Failed to load doctor patients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [filter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPatients();
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        title="My Patients"
        description="Clinical registry of patients under your direct care and cardiology consults."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            {patients.length} Active Records
          </span>
        }
      />

      {/* Search and Filter Bar */}
      <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, MRN, diagnosis..."
            className="w-full h-9 pl-9 pr-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-200/80 focus:border-blue-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === "all"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All Patients
          </button>
          <button
            type="button"
            onClick={() => setFilter("my-patients")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === "my-patients"
                ? "bg-white text-slate-900 shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            My Assigned Patients
          </button>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider h-10 select-none border-b border-slate-200/80 font-semibold">
                <th className="pl-5 pr-3 py-2">Patient Details</th>
                <th className="px-3 py-2">Age / Gender</th>
                <th className="px-3 py-2">Blood Group</th>
                <th className="px-3 py-2">Allergies</th>
                <th className="px-3 py-2">Last Diagnosis</th>
                <th className="px-3 py-2">Active Rx</th>
                <th className="pl-3 pr-5 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    Loading patient directory...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    No matching patients found in clinical registry.
                  </td>
                </tr>
              ) : (
                patients.map((pat) => {
                  const initials = pat.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const hasPenicillin = pat.allergies.some((a) =>
                    a.toLowerCase().includes("penicillin")
                  );

                  return (
                    <tr
                      key={pat._id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Name & MRN */}
                      <td className="pl-5 pr-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-900">
                              {pat.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {pat.mrn} • {pat.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Age & Gender */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="text-xs text-slate-700 font-medium capitalize">
                          {pat.age} yrs • {pat.gender}
                        </span>
                      </td>

                      {/* Blood Group */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {pat.bloodGroup || "O+"}
                        </span>
                      </td>

                      {/* Allergies */}
                      <td className="px-3 py-3.5">
                        {pat.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {pat.allergies.map((all, i) => {
                              const isPeni = all.toLowerCase().includes("penicillin");
                              return (
                                <span
                                  key={i}
                                  className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    isPeni
                                      ? "bg-rose-50 text-rose-700 border-rose-200"
                                      : "bg-amber-50 text-amber-700 border-amber-200"
                                  }`}
                                >
                                  {all}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">NKDA</span>
                        )}
                      </td>

                      {/* Last Diagnosis */}
                      <td className="px-3 py-3.5">
                        <span className="text-xs text-slate-700 line-clamp-1">
                          {pat.lastDiagnosis || "Routine Outpatient Consult"}
                        </span>
                      </td>

                      {/* Active Prescriptions */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {pat.activePrescriptionsCount} active
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="pl-3 pr-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/doctor/patients/${pat._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
                        >
                          <StethoscopeIcon className="w-3.5 h-3.5" />
                          <span>Clinical Chart</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
