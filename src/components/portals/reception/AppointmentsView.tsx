"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "./ReceptionIcons";

interface AppointmentItem {
  _id: string;
  patientId: {
    _id: string;
    mrn: string;
    phone: string;
    bloodGroup?: string;
    gender?: string;
    userId: { name: string; email: string; phone: string; avatar?: string };
  };
  doctorId: {
    _id: string;
    name: string;
    specialty: string;
    department: string;
    roomNumber: string;
    avatar?: string;
  };
  date: string;
  timeSlot: string;
  type: string;
  reason: string;
  status: string;
  bookedBy?: string;
  queueTicket?: string | null;
  queueStatus?: string | null;
}

export function AppointmentsView() {
  const router = useRouter();

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    checkedIn: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFilter, setDateFilter] = useState("today");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("date", dateFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/reception/appointments?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load appointments");
      const json = await res.json();
      setAppointments(json.appointments || []);
      setStats(json.stats || { total: 0, confirmed: 0, checkedIn: 0, completed: 0, cancelled: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching appointments");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter, search]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCheckIn = async (appointmentId: string) => {
    try {
      setCheckingInId(appointmentId);
      const res = await fetch(`/api/reception/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check-in" }),
      });
      if (res.ok) {
        await fetchAppointments();
      } else {
        alert("Unable to check in patient.");
      }
    } catch {
      alert("Error occurred during check-in.");
    } finally {
      setCheckingInId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
            Appointments Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage clinic bookings, doctor rosters, and patient arrivals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/reception/appointments/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs transition-colors"
          >
            <Icons.Plus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </Link>
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total In View</span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">{stats.total}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Checked In</span>
          <span className="text-xl font-bold text-teal-700 mt-0.5 block">{stats.checkedIn}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Confirmed / Scheduled</span>
          <span className="text-xl font-bold text-blue-700 mt-0.5 block">{stats.confirmed}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Completed</span>
          <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{stats.completed}</span>
        </div>
      </div>

      {/* DATE TABS & FILTER BAR */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
        {/* DATE TABS */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-3 overflow-x-auto">
          {[
            { id: "today", label: "Today's Schedule" },
            { id: "upcoming", label: "Upcoming Bookings" },
            { id: "past", label: "Past Appointments" },
            { id: "all", label: "All Records" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                dateFilter === tab.id
                  ? "bg-[#00355f] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SEARCH AND STATUS FILTERS */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icons.Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient name, MRN, or doctor..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:border-teal-500 outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="scheduled">Scheduled</option>
              <option value="checked-in">Checked-in</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button
              onClick={fetchAppointments}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-[#00355f] hover:bg-[#002644] rounded-lg shadow-2xs shrink-0"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>

      {/* APPOINTMENTS TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Icons.Appointments className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No appointments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no appointments matching the selected date or filter parameters.
            </p>
            <Link
              href="/reception/appointments/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor &amp; Location</th>
                  <th className="py-3 px-4">Reason &amp; Type</th>
                  <th className="py-3 px-4">Status &amp; Queue</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => {
                  const isCheckedIn = appt.status === "checked-in";
                  const isConfirmed = appt.status === "confirmed" || appt.status === "scheduled";
                  const isCompleted = appt.status === "completed";
                  const isCancelled = appt.status === "cancelled";

                  return (
                    <tr key={appt._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-900">{appt.timeSlot}</p>
                        <span className="text-[11px] text-slate-500 font-medium">
                          {new Date(appt.date).toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/reception/patients/${appt.patientId?._id}`}
                          className="font-semibold text-[#00355f] hover:underline block"
                        >
                          {appt.patientId?.userId?.name || "Patient"}
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400">
                          {appt.patientId?.mrn}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-medium text-slate-800">{appt.doctorId?.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {appt.doctorId?.specialty} • {appt.doctorId?.roomNumber}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate">
                        <p className="text-slate-700 truncate font-medium">{appt.reason}</p>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {appt.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isCheckedIn && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                              Checked-in
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                              Confirmed
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Completed
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                              Cancelled
                            </span>
                          )}
                          {appt.queueTicket && (
                            <span className="px-1.5 py-0.5 font-mono text-[10px] font-bold bg-slate-900 text-white rounded">
                              {appt.queueTicket}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isConfirmed && (
                            <button
                              onClick={() => handleCheckIn(appt._id)}
                              disabled={checkingInId === appt._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-2xs disabled:opacity-50"
                            >
                              <Icons.Check className="w-3 h-3" />
                              <span>{checkingInId === appt._id ? "..." : "Check In"}</span>
                            </button>
                          )}
                          <Link
                            href={`/reception/appointments/${appt._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                          >
                            <Icons.Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
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
}
