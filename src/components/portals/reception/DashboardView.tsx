"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icons } from "./ReceptionIcons";

interface DashboardData {
  stats: {
    totalAppointments: number;
    checkedIn: number;
    waiting: number;
    inConsultation: number;
    completed: number;
    urgentCases: number;
    activeDoctors: number;
  };
  appointments: Array<{
    _id: string;
    patientId: {
      _id: string;
      mrn: string;
      userId: { name: string; email: string; phone: string };
    };
    doctorId: {
      _id: string;
      name: string;
      specialty: string;
      department: string;
      roomNumber: string;
    };
    timeSlot: string;
    type: string;
    status: string;
    reason: string;
  }>;
  queue: Array<{
    _id: string;
    ticketNumber: string;
    patientId: {
      _id: string;
      mrn: string;
      userId: { name: string; phone: string };
    };
    doctorId: {
      _id: string;
      name: string;
      specialty: string;
      roomNumber: string;
    };
    status: string;
    priority: string;
    checkedInTime: string;
    notes?: string;
  }>;
  doctors: Array<{
    _id: string;
    name: string;
    specialty: string;
    department: string;
    roomNumber: string;
    waitingCount: number;
    currentTicket: string | null;
    status: string;
  }>;
}

export function DashboardView() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/reception/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load dashboard data");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  const handleQuickCheckIn = async (appointmentId: string) => {
    try {
      setCheckingInId(appointmentId);
      const res = await fetch(`/api/reception/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check-in" }),
      });
      if (res.ok) {
        await loadDashboard();
      } else {
        alert("Check-in could not be completed.");
      }
    } catch {
      alert("Error performing check-in.");
    } finally {
      setCheckingInId(null);
    }
  };

  const calculateWaitMinutes = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(1, Math.floor(diff / (60 * 1000)));
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Loading receptionist dashboard...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3">
        <Icons.AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-base font-semibold text-rose-900">Failed to load dashboard</h3>
        <p className="text-xs text-rose-700">{error}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  const stats = data?.stats || {
    totalAppointments: 0,
    checkedIn: 0,
    waiting: 0,
    inConsultation: 0,
    completed: 0,
    urgentCases: 0,
    activeDoctors: 0,
  };

  const appointments = data?.appointments || [];
  const waitingQueue = (data?.queue || []).filter(
    (q) => q.status === "waiting" || q.status === "called"
  );
  const doctors = data?.doctors || [];

  return (
    <div className="space-y-6">
      {/* PAGE TITLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
            Reception Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time outpatient operations • Station 01 Main Lobby
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Icons.Refresh className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 OPERATIONAL STAT METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: TODAY'S APPOINTMENTS */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Today&apos;s Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Icons.Appointments className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.totalAppointments}</span>
            <span className="text-[11px] font-medium text-emerald-600">Scheduled</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed clinic visits today</p>
        </div>

        {/* CARD 2: CHECKED-IN PATIENTS */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Checked-in</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Icons.UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.checkedIn}</span>
            <span className="text-[11px] font-medium text-teal-700">In Facility</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Arrived &amp; verified at reception</p>
        </div>

        {/* CARD 3: PATIENTS WAITING */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Waiting in Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Icons.Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.waiting}</span>
            <span className="text-[11px] font-medium text-amber-700">Avg ~15m</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{stats.inConsultation} currently with doctors</p>
        </div>

        {/* CARD 4: ATTENTION ITEMS */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Attention / Urgent</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <Icons.AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.urgentCases}</span>
            <span className="text-[11px] font-medium text-rose-600">Priority cases</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires immediate desk attention</p>
        </div>
      </div>

      {/* QUICK ACTIONS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/reception/patients/new"
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 rounded-xl shadow-2xs transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <Icons.Plus className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-teal-900">Register Patient</p>
            <p className="text-[11px] text-slate-500">Create new MRN</p>
          </div>
        </Link>

        <Link
          href="/reception/appointments/new"
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 rounded-xl shadow-2xs transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center group-hover:bg-[#00355f] group-hover:text-white transition-colors">
            <Icons.Appointments className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-blue-900">New Appointment</p>
            <p className="text-[11px] text-slate-500">Book doctor slot</p>
          </div>
        </Link>

        <Link
          href="/reception/queue"
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 rounded-xl shadow-2xs transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <Icons.UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">Check-in Patient</p>
            <p className="text-[11px] text-slate-500">Issue queue token</p>
          </div>
        </Link>

        <Link
          href="/reception/walk-ins"
          className="flex items-center gap-3 p-3.5 bg-white border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 rounded-xl shadow-2xs transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Icons.WalkIns className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 group-hover:text-purple-900">Add Walk-in</p>
            <p className="text-[11px] text-slate-500">Rapid queue intake</p>
          </div>
        </Link>
      </div>

      {/* 2-COLUMN MAIN OPERATIONAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2-COLS: TODAY'S APPOINTMENT SCHEDULE */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today&apos;s Appointment Schedule</h2>
              <p className="text-[11px] text-slate-500">Live check-in and arrival monitoring</p>
            </div>
            <Link
              href="/reception/appointments"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 inline-flex items-center gap-1"
            >
              <span>View Full Schedule</span>
              <Icons.ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor &amp; Room</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No appointments booked for today yet.
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt) => {
                    const isCheckedIn = appt.status === "checked-in";
                    const isCompleted = appt.status === "completed";
                    const isConfirmed = appt.status === "confirmed" || appt.status === "scheduled";

                    return (
                      <tr key={appt._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {appt.timeSlot}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            href={`/reception/patients/${appt.patientId?._id}`}
                            className="font-medium text-[#00355f] hover:underline block"
                          >
                            {appt.patientId?.userId?.name || "Unknown Patient"}
                          </Link>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {appt.patientId?.mrn}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <p className="font-medium text-slate-700">{appt.doctorId?.name}</p>
                          <span className="text-[10px] text-slate-400">
                            {appt.doctorId?.department} • {appt.doctorId?.roomNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {isCheckedIn && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                              Checked-in
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Completed
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                              Confirmed
                            </span>
                          )}
                          {appt.status === "cancelled" && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                              Cancelled
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isConfirmed ? (
                            <button
                              onClick={() => handleQuickCheckIn(appt._id)}
                              disabled={checkingInId === appt._id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-2xs disabled:opacity-50"
                            >
                              <Icons.Check className="w-3 h-3" />
                              <span>{checkingInId === appt._id ? "Checking..." : "Check-in"}</span>
                            </button>
                          ) : (
                            <Link
                              href={`/reception/appointments/${appt._id}`}
                              className="text-xs text-slate-500 hover:text-slate-900 p-1"
                              title="View details"
                            >
                              <Icons.Eye className="w-4 h-4 inline" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT 1-COL: LIVE QUEUE & DOCTOR ROSTER */}
        <div className="space-y-6">
          {/* LIVE WAITING QUEUE CARD */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                <h2 className="text-sm font-bold text-slate-900">Live Waiting Queue</h2>
              </div>
              <Link
                href="/reception/queue"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900"
              >
                Queue Board
              </Link>
            </div>

            <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
              {waitingQueue.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No patients currently waiting in the lounge.
                </div>
              ) : (
                waitingQueue.map((item) => {
                  const waitMinutes = calculateWaitMinutes(item.checkedInTime);
                  const isUrgent = item.priority === "urgent" || item.priority === "vip";

                  return (
                    <div
                      key={item._id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        isUrgent
                          ? "bg-rose-50/40 border-rose-200"
                          : "bg-slate-50/60 border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded text-[11px]">
                          {item.ticketNumber}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {item.patientId?.userId?.name || "Patient"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {item.doctorId?.name} • {item.doctorId?.roomNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            waitMinutes > 20
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {waitMinutes}m wait
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DOCTOR & ROOM ROSTER */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-900">Doctor &amp; Room Roster</h2>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {doctors.length} On Duty
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {doctors.map((doc) => (
                <div key={doc._id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{doc.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {doc.department} • <span className="font-medium text-slate-700">{doc.roomNumber}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        doc.waitingCount > 3
                          ? "bg-amber-100 text-amber-800"
                          : "bg-teal-50 text-teal-800"
                      }`}
                    >
                      {doc.waitingCount} waiting
                    </span>
                    {doc.currentTicket && (
                      <p className="text-[10px] text-teal-700 font-mono font-medium mt-0.5">
                        Now: {doc.currentTicket}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
