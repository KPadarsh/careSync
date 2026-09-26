"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SearchIcon,
  RefreshIcon,
  FilterIcon,
  ChevronRightIcon,
  VitalsIcon,
  AssessmentIcon,
  UserIcon,
} from "./NurseIcons";

interface QueueItem {
  _id: string;
  ticketNumber: string;
  department: string;
  roomNumber: string;
  status: "waiting" | "in-assessment" | "ready-for-doctor" | "in-consultation" | "completed" | "called" | "cancelled";
  priority: "normal" | "priority" | "urgent" | "vip";
  checkedInTime: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    mrn: string;
    gender: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    phone?: string;
    allergies?: string[];
  };
  doctorId: {
    _id: string;
    name: string;
    specialty: string;
    department: string;
    roomNumber: string;
  };
  appointmentId?: {
    timeSlot: string;
    reason: string;
    status: string;
  };
  latestAssessment?: any;
  vitals?: any;
}

export const QueueView: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [doctorFilter, setDoctorFilter] = useState("all");

  const fetchQueue = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/nurse/queue");
      if (!res.ok) throw new Error("Failed to load queue");
      const json = await res.json();
      setQueue(json.queue || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch queue");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleUpdateStatus = async (queueId: string, nextStatus: string) => {
    try {
      const res = await fetch("/api/nurse/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId, status: nextStatus }),
      });
      if (res.ok) {
        fetchQueue();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Filter computation
  const filteredQueue = queue.filter((item) => {
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (priorityFilter !== "all" && item.priority !== priorityFilter) return false;
    if (doctorFilter !== "all" && item.doctorId?.name !== doctorFilter) return false;

    if (search.trim()) {
      const s = search.toLowerCase();
      const name = `${item.patientId?.firstName || ""} ${item.patientId?.lastName || ""}`.toLowerCase();
      const token = (item.ticketNumber || "").toLowerCase();
      const mrn = (item.patientId?.mrn || "").toLowerCase();
      const doc = (item.doctorId?.name || "").toLowerCase();
      if (!name.includes(s) && !token.includes(s) && !mrn.includes(s) && !doc.includes(s)) {
        return false;
      }
    }
    return true;
  });

  // Calculate counts for tab pills
  const countAll = queue.length;
  const countWaiting = queue.filter((q) => q.status === "waiting").length;
  const countInAssessment = queue.filter((q) => q.status === "in-assessment").length;
  const countReady = queue.filter((q) => q.status === "ready-for-doctor").length;
  const countCompleted = queue.filter((q) => q.status === "completed").length;

  // Extract unique doctors
  const doctorsList = Array.from(new Set(queue.map((q) => q.doctorId?.name).filter(Boolean)));

  const calculateWaitMinutes = (checkedInTimeStr: string) => {
    try {
      const diffMs = Date.now() - new Date(checkedInTimeStr).getTime();
      const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      return mins;
    } catch {
      return 10;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006a61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Clinical Queue...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* TOP HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">Patient Queue</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              Live Shift
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Patients waiting for nursing care &amp; outpatient vitals triage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchQueue}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all"
          >
            <RefreshIcon size={14} className={refreshing ? "animate-spin text-teal-600" : "text-slate-500"} />
            <span>{refreshing ? "Syncing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* KPI TILES (Matching Stitch Queue Screen) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Waiting */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Waiting</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-extrabold text-[#00355f]">{countWaiting}</span>
              <span className="text-xs text-slate-500">patients</span>
            </div>
            <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <ClockIcon size={13} className="text-[#00355f]" />
              <span>Awaiting vitals triage</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#00355f] flex items-center justify-center">
            <ClockIcon size={24} />
          </div>
        </div>

        {/* KPI 2: In Assessment */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Assessment</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-extrabold text-[#d97706]">{countInAssessment}</span>
              <span className="text-xs text-slate-500">in progress</span>
            </div>
            <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <VitalsIcon size={13} className="text-[#d97706]" />
              <span>In triage bay</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#d97706] flex items-center justify-center">
            <AssessmentIcon size={24} />
          </div>
        </div>

        {/* KPI 3: Ready for Doctor */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ready for Doctor</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-extrabold text-[#006a61]">{countReady}</span>
              <span className="text-xs text-slate-500">cleared</span>
            </div>
            <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <CheckCircleIcon size={13} className="text-[#006a61]" />
              <span>Vitals &amp; notes logged</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#006a61] flex items-center justify-center">
            <CheckCircleIcon size={24} />
          </div>
        </div>
      </div>

      {/* SEARCH, TABS & FILTERS CONTAINER */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col gap-4">
        {/* Row 1: Search and Dropdowns */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-lg">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search patient name, MRN, or token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-[#eff4ff] border border-slate-200 rounded-lg text-xs lg:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#00355f] transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Doctor Filter */}
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:bg-white"
            >
              <option value="all">All Doctors</option>
              {doctorsList.map((doc: any) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="priority">Priority</option>
              <option value="normal">Normal</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="waiting">Waiting</option>
              <option value="in-assessment">In Assessment</option>
              <option value="ready-for-doctor">Ready for Doctor</option>
              <option value="completed">Completed</option>
            </select>

            {(search || statusFilter !== "all" || priorityFilter !== "all" || doctorFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setDoctorFilter("all");
                }}
                className="h-9 px-3 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-medium"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Status Quick Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-nowrap">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === "all"
                ? "bg-[#00355f] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All <span className="ml-1 opacity-80">({countAll})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("waiting")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === "waiting"
                ? "bg-[#00355f] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Waiting <span className="ml-1 opacity-80">({countWaiting})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("in-assessment")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === "in-assessment"
                ? "bg-[#d97706] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            In Assessment <span className="ml-1 opacity-80">({countInAssessment})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("ready-for-doctor")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === "ready-for-doctor"
                ? "bg-[#006a61] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Ready for Doctor <span className="ml-1 opacity-80">({countReady})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === "completed"
                ? "bg-[#00355f] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Completed <span className="ml-1 opacity-80">({countCompleted})</span>
          </button>
        </div>
      </div>

      {/* QUEUE TABLE CARD */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
        {filteredQueue.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No patients match current queue filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 w-24">Token</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Doctor &amp; Room</th>
                  <th className="py-3.5 px-4">Appt.</th>
                  <th className="py-3.5 px-4">Wait Time</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.map((item) => {
                  const patient = item.patientId;
                  const patientName = `${patient?.firstName || ""} ${patient?.lastName || "Patient"}`;
                  const pId = patient?._id;
                  const waitMins = calculateWaitMinutes(item.checkedInTime);
                  const isUrgent = item.priority === "urgent";
                  const isPriority = item.priority === "priority";
                  const isWaiting = item.status === "waiting";
                  const isInAssessment = item.status === "in-assessment";
                  const isReady = item.status === "ready-for-doctor";
                  const isCompleted = item.status === "completed";

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isUrgent ? "bg-rose-50/20" : ""
                      }`}
                    >
                      {/* Token */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                            isUrgent
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : isPriority
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}
                        >
                          {item.ticketNumber}
                        </span>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/nurse/patients/${pId}`}
                            className="text-sm font-semibold text-slate-900 hover:text-[#006a61] hover:underline"
                          >
                            {patientName}
                          </Link>
                          <span className="text-[11px] text-slate-500">
                            {patient?.gender || "M"} • MRN: <span className="font-mono">{patient?.mrn || "N/A"}</span>
                          </span>
                        </div>
                      </td>

                      {/* Doctor & Room */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{item.doctorId?.name || "Dr. Staff"}</span>
                          <span className="text-[11px] text-slate-500">
                            {item.doctorId?.specialty || item.department} • {item.roomNumber || "Room 302"}
                          </span>
                        </div>
                      </td>

                      {/* Appt */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {item.appointmentId?.timeSlot || "Walk-in"}
                      </td>

                      {/* Wait Time */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            waitMins > 25
                              ? "bg-rose-100 text-rose-800"
                              : waitMins > 15
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <ClockIcon size={12} />
                          <span>{waitMins} min</span>
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isUrgent
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : isPriority
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            isWaiting
                              ? "bg-slate-100 text-slate-700"
                              : isInAssessment
                              ? "bg-amber-100 text-amber-800 font-semibold"
                              : isReady
                              ? "bg-teal-100 text-teal-800 font-semibold"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.status.replace("-", " ")}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right pr-6">
                        {isWaiting && (
                          <Link
                            href={`/nurse/assessments/${pId}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all ${
                              isUrgent
                                ? "bg-rose-600 text-white hover:bg-rose-700"
                                : "bg-[#00355f] text-white hover:bg-[#0f4c81]"
                            }`}
                          >
                            <span>Start Assessment</span>
                          </Link>
                        )}

                        {isInAssessment && (
                          <Link
                            href={`/nurse/assessments/${pId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold shadow-2xs transition-all"
                          >
                            <span>Continue</span>
                          </Link>
                        )}

                        {isReady && (
                          <Link
                            href={`/nurse/patients/${pId}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#006a61] text-white hover:bg-[#005049] text-xs font-semibold shadow-2xs transition-all"
                          >
                            <span>Doctor Handoff</span>
                          </Link>
                        )}

                        {isCompleted && (
                          <Link
                            href={`/nurse/records`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium transition-all"
                          >
                            <span>View Record</span>
                          </Link>
                        )}
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
