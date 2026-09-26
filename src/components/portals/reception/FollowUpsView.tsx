"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icons } from "./ReceptionIcons";

interface FollowUpItem {
  _id: string;
  recommendedDate: string;
  reason: string;
  clinicalInstructions: string;
  status: "pending" | "scheduled" | "completed" | "dismissed";
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
  scheduledAppointmentId?: {
    date: string;
    timeSlot: string;
    status: string;
  };
}

export function FollowUpsView() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [stats, setStats] = useState({
    dueToday: 0,
    overdue: 0,
    upcoming: 0,
    completed: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"due-today" | "overdue" | "upcoming" | "all">("due-today");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reception/follow-ups?status=${tab}`);
      if (!res.ok) throw new Error("Failed to load follow-ups");
      const json = await res.json();
      setFollowUps(json.followUps || []);
      setStats(json.stats || { dueToday: 0, overdue: 0, upcoming: 0, completed: 0, total: 0 });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching follow-ups");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const handleMarkHandled = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/reception/follow-ups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      if (res.ok) {
        await fetchFollowUps();
      } else {
        alert("Could not update follow-up status.");
      }
    } catch {
      alert("Error updating follow-up.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
            Follow-up Task Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physician-ordered recalls, postoperative dressings, and medication reviews
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs"
          >
            <Icons.Printer className="w-3.5 h-3.5" />
            <span>Export Recall List</span>
          </button>
          <button
            onClick={fetchFollowUps}
            className="p-1.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs"
            title="Refresh"
          >
            <Icons.Refresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* METRIC STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Due Today</span>
          <span className="text-xl font-bold text-amber-700 mt-0.5 block">{stats.dueToday}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Overdue</span>
          <span className="text-xl font-bold text-rose-700 mt-0.5 block">{stats.overdue}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Upcoming</span>
          <span className="text-xl font-bold text-blue-700 mt-0.5 block">{stats.upcoming}</span>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Handled / Completed</span>
          <span className="text-xl font-bold text-emerald-700 mt-0.5 block">{stats.completed}</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: "due-today", label: "Due Today", count: stats.dueToday },
          { id: "overdue", label: "Overdue", count: stats.overdue },
          { id: "upcoming", label: "Upcoming", count: stats.upcoming },
          { id: "all", label: "All Records", count: stats.total },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "due-today" | "overdue" | "upcoming" | "all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              tab === t.id
                ? "bg-[#00355f] text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                tab === t.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading follow-ups...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : followUps.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Icons.FollowUps className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No follow-ups in this queue</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All clinical recall tasks under this tab have been addressed or none are scheduled.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Patient &amp; Contact</th>
                  <th className="py-3 px-4">Ordering Physician</th>
                  <th className="py-3 px-4">Recall Clinical Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.map((fu) => {
                  const isPending = fu.status === "pending";
                  const isScheduled = fu.status === "scheduled";
                  const isCompleted = fu.status === "completed";

                  return (
                    <tr key={fu._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-bold text-slate-900">
                          {new Date(fu.recommendedDate).toLocaleDateString()}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">Recalled</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Link
                          href={`/reception/patients/${fu.patientId?._id}`}
                          className="font-bold text-[#00355f] hover:underline block"
                        >
                          {fu.patientId?.userId?.name || "Patient"}
                        </Link>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {fu.patientId?.mrn} • {fu.patientId?.phone || fu.patientId?.userId?.phone}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{fu.doctorId?.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {fu.doctorId?.department} • {fu.doctorId?.roomNumber}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="font-semibold text-slate-900">{fu.reason}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 italic">
                          &quot;{fu.clinicalInstructions}&quot;
                        </p>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Pending Action
                          </span>
                        )}
                        {isScheduled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            Booked
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Handled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <Link
                                href={`/reception/appointments/new?patientId=${fu.patientId?._id}&followUpId=${fu._id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-2xs"
                              >
                                <Icons.Appointments className="w-3 h-3" />
                                <span>Schedule</span>
                              </Link>
                              <button
                                onClick={() => handleMarkHandled(fu._id)}
                                disabled={actionLoadingId === fu._id}
                                className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                                title="Mark Handled without booking"
                              >
                                {actionLoadingId === fu._id ? "..." : "Done"}
                              </button>
                            </>
                          )}
                          {!isPending && (
                            <span className="text-[11px] text-slate-400">Resolved</span>
                          )}
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
