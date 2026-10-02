"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SearchIcon,
  RefreshIcon,
  ArrowForwardIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
} from "./DoctorIcons";
import { PageHeader } from "@/components/ui/PageHeader";

interface QueueItem {
  _id: string;
  ticketNumber: string;
  status: string; // ready-for-doctor, in-consultation, completed
  priority: string;
  roomNumber: string;
  department: string;
  checkedInTime: string;
  calledTime?: string;
  completedTime?: string;
  waitingMinutes: number;
  patient: {
    _id: string;
    name: string;
    mrn: string;
    gender: string;
    age: number;
    bloodGroup: string;
    allergies: string[];
    avatar?: string;
  };
  appointment: {
    timeSlot: string;
    reason: string;
    status: string;
  };
  nurseAssessment?: {
    _id: string;
    status: string;
    vitals?: {
      bloodPressure?: string;
      heartRate?: number;
      oxygenSaturation?: number;
      temperature?: number;
      painScore?: number;
    };
    chiefComplaint?: string;
    symptoms?: string[];
    condition?: string;
    triagePriority?: string;
    nurseName?: string;
    doctorHandoffNotes?: string;
  };
}

export const QueueView: React.FC = () => {
  const router = useRouter();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState({ all: 0, waiting: 0, inConsultation: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "waiting" | "in-consultation" | "completed">("all");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueue = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/doctor/queue?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
        if (json.counts) setCounts(json.counts);
      }
    } catch (err) {
      console.error("Failed to load doctor queue:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueue();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchQueue();
  };

  const handleStartConsultation = async (patientId: string, queueId: string) => {
    try {
      await fetch("/api/doctor/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueId, action: "start-consultation" }),
      });
    } catch {
      // ignore
    }
    router.push(`/doctor/consultations/${patientId}`);
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <PageHeader
        title="Today's Queue"
        description="Patients evaluated and handed off by nursing, ready for your consultation."
        badge={{ label: "Nursing Handoff Active", tone: "success" }}
        action={
          <button
            onClick={handleRefresh}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all text-xs font-semibold shadow-2xs"
          >
            <RefreshIcon className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200/80 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Status Segment Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-lg text-slate-500">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            All <span className="ml-1 text-slate-400 font-normal">({counts.all})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("waiting")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "waiting"
                ? "bg-white text-slate-900 shadow-xs"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            Waiting{" "}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
              {counts.waiting}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("in-consultation")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "in-consultation"
                ? "bg-white text-slate-900 shadow-xs"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            In Consultation{" "}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[10px]">
              {counts.inConsultation}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === "completed"
                ? "bg-white text-slate-900 shadow-xs"
                : "hover:text-slate-900 text-slate-600"
            }`}
          >
            Completed <span className="ml-1 text-slate-400 font-normal">({counts.completed})</span>
          </button>
        </div>

        {/* Quick Search & Priority Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative min-w-[240px] flex-1 sm:flex-initial">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient by name or MRN..."
              className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
          </form>

          {/* Priority Dropdown */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 pl-3 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-medium appearance-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">Urgent & Priority</option>
              <option value="routine">Normal / Routine</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Patient List Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider h-10 select-none border-b border-slate-200">
                <th className="pl-5 pr-3 py-2 w-24 font-semibold">Time</th>
                <th className="px-3 py-2 font-semibold">Patient</th>
                <th className="px-3 py-2 font-semibold">Appointment Reason</th>
                <th className="px-3 py-2 font-semibold">Nurse Assessment Status</th>
                <th className="px-3 py-2 w-28 font-semibold">Priority</th>
                <th className="px-3 py-2 w-32 font-semibold">Wait Time</th>
                <th className="px-3 py-2 w-36 font-semibold">Status</th>
                <th className="pl-3 pr-5 py-2 w-44 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading queue items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No patients currently in this queue status.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isWaiting = item.status === "ready-for-doctor" || item.status === "waiting";
                  const isInConsultation = item.status === "in-consultation";
                  const isCompleted = item.status === "completed";
                  const isUrgent = item.priority === "urgent" || item.nurseAssessment?.triagePriority === "urgent";

                  const initials = item.patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isInConsultation ? "bg-sky-50/40" : ""
                      }`}
                    >
                      {/* Time */}
                      <td className="pl-5 pr-3 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-900">
                          {item.appointment.timeSlot}
                        </span>
                      </td>

                      {/* Patient Details */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <Link
                            href={`/doctor/patients/${item.patient._id}`}
                            className="flex flex-col group"
                          >
                            <span className="text-xs sm:text-[13px] font-semibold text-slate-900 group-hover:text-sky-600 leading-snug transition-colors">
                              {item.patient.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.patient.mrn} • {item.patient.age}y {item.patient.gender}
                            </span>
                          </Link>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-3 py-3.5 max-w-[200px]">
                        <span className="text-xs text-slate-700 truncate block">
                          {item.appointment.reason}
                        </span>
                      </td>

                      {/* Nurse Assessment Status */}
                      <td className="px-3 py-3.5 max-w-[240px]">
                        {item.nurseAssessment ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-sky-700">
                                BP: {item.nurseAssessment.vitals?.bloodPressure || "120/80"}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                HR: {item.nurseAssessment.vitals?.heartRate || 72}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 truncate" title={item.nurseAssessment.chiefComplaint}>
                              {item.nurseAssessment.chiefComplaint || "Triage completed"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Pending Nurse Vitals
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {isUrgent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Urgent
                          </span>
                        ) : item.priority === "priority" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            Priority
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-medium">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Wait Time */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="text-xs text-slate-500">
                          {item.waitingMinutes} mins
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {isWaiting && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Ready for Doctor
                          </span>
                        )}
                        {isInConsultation && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                            In Consultation
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Completed
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="pl-3 pr-5 py-3.5 whitespace-nowrap text-right">
                        {isWaiting && (
                          <button
                            onClick={() => handleStartConsultation(item.patient._id, item._id)}
                            type="button"
                            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
                          >
                            Start Consultation
                          </button>
                        )}
                        {isInConsultation && (
                          <button
                            onClick={() => router.push(`/doctor/consultations/${item.patient._id}`)}
                            type="button"
                            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors"
                          >
                            Continue
                          </button>
                        )}
                        {isCompleted && (
                          <Link
                            href={`/doctor/patients/${item.patient._id}`}
                            className="text-slate-500 hover:text-slate-900 text-xs font-medium inline-flex items-center gap-0.5 transition-colors"
                          >
                            <span>View Chart</span>
                            <ChevronRightIcon className="w-3.5 h-3.5" />
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
    </div>
  );
};
