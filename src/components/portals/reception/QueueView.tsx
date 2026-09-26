"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icons } from "./ReceptionIcons";

interface QueueItem {
  _id: string;
  ticketNumber: string;
  patientId: {
    _id: string;
    mrn: string;
    phone: string;
    userId: { name: string; email: string; phone: string };
  };
  doctorId: {
    _id: string;
    name: string;
    specialty: string;
    department: string;
    roomNumber: string;
  };
  department: string;
  roomNumber: string;
  status: "waiting" | "in-consultation" | "completed" | "called" | "cancelled";
  priority: "normal" | "urgent" | "vip";
  source: "appointment" | "walk-in";
  checkedInTime: string;
  notes?: string;
}

interface CandidateItem {
  _id: string;
  timeSlot: string;
  reason: string;
  status: string;
  patientId: {
    _id: string;
    mrn: string;
    phone: string;
    userId: { name: string; email: string; phone: string };
  };
  doctorId: {
    _id: string;
    name: string;
    specialty: string;
    department: string;
    roomNumber: string;
  };
}

export function QueueView() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    waiting: 0,
    inConsultation: 0,
    completed: 0,
    urgent: 0,
    avgWaitMinutes: 15,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState("all");
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/reception/queue");
      if (!res.ok) throw new Error("Failed to load live queue");
      const json = await res.json();
      setQueue(json.queue || []);
      setCandidates(json.candidates || []);
      setStats(json.stats || { total: 0, waiting: 0, inConsultation: 0, completed: 0, urgent: 0, avgWaitMinutes: 15 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching queue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleCheckInCandidate = async (candidate: CandidateItem) => {
    try {
      setCheckingInId(candidate._id);
      const res = await fetch("/api/reception/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: candidate._id,
          patientId: candidate.patientId._id,
          doctorId: candidate.doctorId._id,
          priority: "normal",
        }),
      });
      if (res.ok) {
        await fetchQueue();
      } else {
        alert("Failed to check in patient.");
      }
    } catch {
      alert("Error occurred during check-in.");
    } finally {
      setCheckingInId(null);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    newStatus: "waiting" | "called" | "in-consultation" | "completed" | "cancelled"
  ) => {
    try {
      setActionLoadingId(id);
      const res = await fetch("/api/reception/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await fetchQueue();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdatePriority = async (id: string, newPriority: "normal" | "urgent" | "vip") => {
    try {
      setActionLoadingId(id);
      const res = await fetch("/api/reception/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, priority: newPriority }),
      });
      if (res.ok) {
        await fetchQueue();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const calculateWaitMinutes = (checkedInTimeStr: string) => {
    const diff = Date.now() - new Date(checkedInTimeStr).getTime();
    return Math.max(1, Math.floor(diff / (60 * 1000)));
  };

  const filteredQueue = queue.filter((item) => {
    if (roomFilter === "all") return true;
    return item.roomNumber?.toLowerCase().includes(roomFilter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
              Clinic Queue &amp; Check-in
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse" />
              Live Terminal
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Lounge patient flow, room calls, and priority management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/reception/walk-ins"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs transition-colors"
          >
            <Icons.WalkIns className="w-4 h-4" />
            <span>+ Rapid Walk-in</span>
          </Link>
          <button
            onClick={fetchQueue}
            className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs"
            title="Refresh"
          >
            <Icons.Refresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Waiting in Lounge</span>
          <span className="text-xl font-bold text-slate-900 mt-0.5 block">{stats.waiting}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">In Consultation</span>
          <span className="text-xl font-bold text-teal-700 mt-0.5 block">{stats.inConsultation}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Priority Cases</span>
          <span className="text-xl font-bold text-rose-600 mt-0.5 block">{stats.urgent}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Avg Wait Time</span>
          <span className="text-xl font-bold text-amber-600 mt-0.5 block">{stats.avgWaitMinutes}m</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Completed Today</span>
          <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{stats.completed}</span>
        </div>
      </div>

      {/* MAIN 2-COLUMN LAYOUT: CHECK-IN CANDIDATES (LEFT) + LIVE QUEUE BOARD (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 1-COL: TODAY'S EXPECTED ARRIVALS (READY FOR CHECK-IN) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Arriving Appointments</h2>
              <p className="text-[11px] text-slate-500">Scheduled patients awaiting arrival</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800">
              {candidates.length} Pending
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] flex-1">
            {candidates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                All scheduled patients for today have been checked in or no more bookings pending.
              </div>
            ) : (
              candidates.map((cand) => (
                <div key={cand._id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {cand.patientId?.userId?.name || "Patient"}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {cand.timeSlot} • {cand.patientId?.mrn}
                    </p>
                    <p className="text-[10px] text-teal-700 truncate mt-0.5">
                      {cand.doctorId?.name} ({cand.doctorId?.roomNumber})
                    </p>
                  </div>
                  <button
                    onClick={() => handleCheckInCandidate(cand)}
                    disabled={checkingInId === cand._id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs disabled:opacity-50 shrink-0"
                  >
                    <Icons.Check className="w-3.5 h-3.5" />
                    <span>{checkingInId === cand._id ? "..." : "Check In"}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT 2-COLS: LIVE QUEUE BOARD */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden flex flex-col">
          {/* TOOLBAR */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Live Lounge Waiting Queue</h2>
              <p className="text-[11px] text-slate-500">Real-time room routing and status</p>
            </div>

            {/* ROOM FILTER BUTTONS */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "All Rooms" },
                { id: "302", label: "Rm 302" },
                { id: "201", label: "Rm 201" },
                { id: "205", label: "Rm 205" },
                { id: "104", label: "Rm 104" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoomFilter(r.id)}
                  className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-colors ${
                    roomFilter === r.id
                      ? "bg-[#00355f] text-white shadow-2xs"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE OF QUEUE TOKENS */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Physician &amp; Room</th>
                  <th className="py-3 px-4">Priority &amp; Wait</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No patients currently active in the queue for this room.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((item) => {
                    const waitMins = calculateWaitMinutes(item.checkedInTime);
                    const isUrgent = item.priority === "urgent" || item.priority === "vip";
                    const isConsulting = item.status === "in-consultation";
                    const isCalled = item.status === "called";
                    const isWaiting = item.status === "waiting";
                    const isCompleted = item.status === "completed";

                    return (
                      <tr
                        key={item._id}
                        className={`transition-colors ${
                          isUrgent && isWaiting
                            ? "bg-rose-50/30 hover:bg-rose-50/50"
                            : isConsulting
                            ? "bg-teal-50/30 hover:bg-teal-50/50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-mono text-sm font-bold px-2.5 py-1 bg-slate-900 text-white rounded-md shadow-2xs">
                            {item.ticketNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-slate-900">
                            {item.patientId?.userId?.name || "Patient"}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.patientId?.mrn}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{item.doctorId?.name}</p>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {item.roomNumber || item.doctorId?.roomNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {item.priority === "urgent" && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded">
                                URGENT
                              </span>
                            )}
                            {item.priority === "vip" && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded">
                                VIP
                              </span>
                            )}
                            {item.priority === "normal" && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded">
                                Normal
                              </span>
                            )}
                            <span className="text-[11px] text-slate-500 font-mono">
                              {waitMins}m
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isWaiting && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Waiting
                            </span>
                          )}
                          {isCalled && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              Called to Room
                            </span>
                          )}
                          {isConsulting && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-100 text-teal-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                              With Doctor
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {isWaiting && (
                              <button
                                onClick={() => handleUpdateStatus(item._id, "called")}
                                disabled={actionLoadingId === item._id}
                                className="px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded"
                                title="Call Patient"
                              >
                                Call
                              </button>
                            )}
                            {(isWaiting || isCalled) && (
                              <button
                                onClick={() => handleUpdateStatus(item._id, "in-consultation")}
                                disabled={actionLoadingId === item._id}
                                className="px-2 py-1 text-[11px] font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded"
                                title="In Room"
                              >
                                In-Room
                              </button>
                            )}
                            {isConsulting && (
                              <button
                                onClick={() => handleUpdateStatus(item._id, "completed")}
                                disabled={actionLoadingId === item._id}
                                className="px-2 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded"
                                title="Complete"
                              >
                                Complete
                              </button>
                            )}
                            {isWaiting && (
                              <button
                                onClick={() =>
                                  handleUpdatePriority(
                                    item._id,
                                    item.priority === "urgent" ? "normal" : "urgent"
                                  )
                                }
                                disabled={actionLoadingId === item._id}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Toggle Urgent"
                              >
                                <Icons.AlertTriangle className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
    </div>
  );
}
