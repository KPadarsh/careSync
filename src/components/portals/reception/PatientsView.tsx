"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "./ReceptionIcons";

interface PatientItem {
  _id: string;
  mrn: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    status: string;
  };
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  address?: {
    city?: string;
    state?: string;
  };
  lastAppointment?: {
    date: string;
    timeSlot: string;
    doctorId?: { name: string; specialty: string };
  };
  totalAppointments: number;
}

export function PatientsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(initialQuery);
  const [genderFilter, setGenderFilter] = useState("all");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (genderFilter !== "all") params.set("gender", genderFilter);
      if (bloodGroupFilter !== "all") params.set("bloodGroup", bloodGroupFilter);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/reception/patients?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load patients");
      const json = await res.json();
      setPatients(json.patients || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setTotalCount(json.pagination?.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching patients");
    } finally {
      setLoading(false);
    }
  }, [search, genderFilter, bloodGroupFilter, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const calculateAge = (dobString?: string) => {
    if (!dobString) return null;
    const diffMs = Date.now() - new Date(dobString).getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-5">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
            Patient Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, register, and manage patient demographics ({totalCount} registered)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/reception/patients/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs transition-colors"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </Link>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icons.Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, MRN, phone number, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:border-teal-500 outline-hidden"
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <select
              value={bloodGroupFilter}
              onChange={(e) => {
                setBloodGroupFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:border-teal-500 outline-hidden"
            >
              <option value="all">All Blood Groups</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>

            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#00355f] hover:bg-[#002847] rounded-lg shadow-2xs transition-colors shrink-0"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* PATIENT TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Searching records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            {error}
          </div>
        ) : patients.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Icons.Patients className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No patient records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching profiles found with current search filters. You can register a new patient now.
            </p>
            <Link
              href="/reception/patients/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              <span>Register Patient</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Patient &amp; MRN</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Latest Encounter</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => {
                  const age = calculateAge(p.dateOfBirth);

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                            {p.user?.name?.slice(0, 2).toUpperCase() || "PT"}
                          </div>
                          <div>
                            <Link
                              href={`/reception/patients/${p._id}`}
                              className="font-semibold text-slate-900 hover:text-teal-700 block"
                            >
                              {p.user?.name || "Patient"}
                            </Link>
                            <span className="font-mono text-[11px] text-slate-400 font-medium">
                              {p.mrn}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="text-slate-800 font-medium">{p.phone || p.user?.phone || "—"}</p>
                        <p className="text-slate-400 text-[11px]">{p.user?.email || "—"}</p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="capitalize text-slate-700">
                            {p.gender || "—"}{age ? `, ${age}y` : ""}
                          </span>
                          {p.bloodGroup && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-700 border border-rose-200/60">
                              {p.bloodGroup}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {p.address?.city && p.address?.state
                          ? `${p.address.city}, ${p.address.state}`
                          : "Not recorded"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.lastAppointment ? (
                          <div>
                            <p className="text-slate-800 font-medium">
                              {new Date(p.lastAppointment.date).toLocaleDateString()}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {p.lastAppointment.doctorId?.name || "Clinic Visit"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No visits recorded</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/reception/appointments/new?patientId=${p._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                            title="Schedule Appointment"
                          >
                            <Icons.Appointments className="w-3.5 h-3.5" />
                            <span>Book</span>
                          </Link>
                          <Link
                            href={`/reception/patients/${p._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#00355f] hover:bg-[#002644] rounded-md transition-colors"
                            title="View Patient Record"
                          >
                            <Icons.Eye className="w-3.5 h-3.5" />
                            <span>View</span>
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

        {/* PAGINATION BAR */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
