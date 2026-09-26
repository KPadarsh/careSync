"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, ChevronRightIcon, PlusIcon, StethoscopeIcon } from "./DoctorIcons";

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
    <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            My Patients
          </h1>
          <p className="text-[14px] text-[#565e74] mt-0.5">
            Clinical registry of patients under your direct care and cardiology consults.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-[#eff4ff] text-[12px] font-semibold text-[#006194]">
            {patients.length} Active Records
          </span>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707881]">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, MRN, diagnosis..."
            className="w-full h-9 pl-9 pr-4 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] placeholder:text-[#707881] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#006194]/20 border border-transparent focus:border-[#006194] transition-all"
          />
        </form>

        <div className="flex items-center gap-1.5 bg-[#eff4ff] p-1 rounded-lg self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              filter === "all"
                ? "bg-white text-[#0b1c30] shadow-xs font-semibold"
                : "text-[#565e74] hover:text-[#0b1c30]"
            }`}
          >
            All Patients
          </button>
          <button
            type="button"
            onClick={() => setFilter("my-patients")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
              filter === "my-patients"
                ? "bg-white text-[#0b1c30] shadow-xs font-semibold"
                : "text-[#565e74] hover:text-[#0b1c30]"
            }`}
          >
            My Assigned Patients
          </button>
        </div>
      </div>

      {/* Patients Grid / Table */}
      <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#eff4ff]/60 text-[#565e74] text-[12px] uppercase tracking-wider h-10 select-none border-b border-[#bfc7d2]/20">
                <th className="pl-5 pr-3 py-2 font-semibold">Patient Details</th>
                <th className="px-3 py-2 font-semibold">Age / Gender</th>
                <th className="px-3 py-2 font-semibold">Blood Group</th>
                <th className="px-3 py-2 font-semibold">Allergies</th>
                <th className="px-3 py-2 font-semibold">Last Diagnosis</th>
                <th className="px-3 py-2 font-semibold">Active Rx</th>
                <th className="pl-3 pr-5 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bfc7d2]/20 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#565e74]">
                    Loading patient directory...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#565e74]">
                    No matching patients found.
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
                      className="hover:bg-[#eff4ff]/40 transition-colors"
                    >
                      {/* Name & MRN */}
                      <td className="pl-5 pr-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#dae2fd] text-[#131b2e] flex items-center justify-center font-bold text-[12px] shrink-0">
                            {initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-[#0b1c30]">
                              {pat.name}
                            </span>
                            <span className="text-[11px] text-[#565e74]">
                              {pat.mrn} • {pat.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Age / Gender */}
                      <td className="px-3 py-3.5 whitespace-nowrap text-[#565e74]">
                        {pat.age} yrs • {pat.gender}
                      </td>

                      {/* Blood Group */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded bg-[#eff4ff] text-[#006194] font-semibold text-[11px]">
                          {pat.bloodGroup}
                        </span>
                      </td>

                      {/* Allergies */}
                      <td className="px-3 py-3.5 max-w-[180px]">
                        {hasPenicillin ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-bold">
                            Penicillin
                          </span>
                        ) : pat.allergies.length > 0 ? (
                          <span className="text-[12px] text-[#565e74] truncate block">
                            {pat.allergies.join(", ")}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8ca0be]">None documented</span>
                        )}
                      </td>

                      {/* Last Diagnosis */}
                      <td className="px-3 py-3.5 max-w-[200px]">
                        <span className="text-[13px] text-[#0b1c30] truncate block">
                          {pat.lastDiagnosis}
                        </span>
                      </td>

                      {/* Active Rx */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="text-[12px] font-semibold text-[#00873a]">
                          {pat.activePrescriptionsCount} Regimens
                        </span>
                      </td>

                      {/* Action */}
                      <td className="pl-3 pr-5 py-3.5 whitespace-nowrap text-right">
                        <Link
                          href={`/doctor/patients/${pat._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#006194] text-[#006194] hover:text-white transition-all text-[12px] font-semibold"
                        >
                          <span>Clinical Chart</span>
                          <ChevronRightIcon className="w-3.5 h-3.5" />
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
