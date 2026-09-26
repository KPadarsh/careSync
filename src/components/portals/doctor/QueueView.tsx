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
    <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Today's Queue
          </h1>
          <p className="text-[14px] text-[#565e74] mt-0.5">
            Patients evaluated and handed off by nursing, ready for your consultation.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eff4ff] text-[#565e74] text-[12px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00873a]" />
            <span>Nursing Handoff Active</span>
          </div>
          <button
            onClick={handleRefresh}
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#bfc7d2]/50 text-[#0b1c30] hover:bg-[#eff4ff] transition-all text-[13px] font-medium shadow-xs"
          >
            <RefreshIcon className={`w-4 h-4 text-[#565e74] ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-[#bfc7d2]/30 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Status Segment Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-[#eff4ff] rounded-lg text-[#565e74]">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
              activeTab === "all"
                ? "bg-white text-[#0b1c30] shadow-xs"
                : "hover:text-[#0b1c30] text-[#565e74]"
            }`}
          >
            All <span className="ml-1 text-[#565e74] font-normal">({counts.all})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("waiting")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
              activeTab === "waiting"
                ? "bg-white text-[#0b1c30] shadow-xs"
                : "hover:text-[#0b1c30] text-[#565e74]"
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
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
              activeTab === "in-consultation"
                ? "bg-white text-[#0b1c30] shadow-xs"
                : "hover:text-[#0b1c30] text-[#565e74]"
            }`}
          >
            In Consultation{" "}
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#cce5ff] text-[#004b73] font-bold text-[10px]">
              {counts.inConsultation}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
              activeTab === "completed"
                ? "bg-white text-[#0b1c30] shadow-xs"
                : "hover:text-[#0b1c30] text-[#565e74]"
            }`}
          >
            Completed <span className="ml-1 text-[#565e74] font-normal">({counts.completed})</span>
          </button>
        </div>

        {/* Quick Search & Priority Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative min-w-[240px] flex-1 sm:flex-initial">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707881]">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient by name or MRN..."
              className="w-full h-9 pl-9 pr-4 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] placeholder:text-[#707881] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#006194]/20 transition-all border border-transparent focus:border-[#006194]"
            />
          </form>

          {/* Priority Dropdown */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 pl-3 pr-8 bg-[#eff4ff] rounded-lg text-[12px] text-[#0b1c30] font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-[#006194]/20 cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">Urgent & Priority</option>
              <option value="routine">Normal / Routine</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[#707881]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Patient List Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[960px]">
            <thead>
              <tr className="bg-[#eff4ff]/60 text-[#565e74] text-[12px] uppercase tracking-wider h-10 select-none border-b border-[#bfc7d2]/20">
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
            <tbody className="divide-y divide-[#bfc7d2]/20 text-[13px] text-[#0b1c30]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#565e74]">
                    Loading queue items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#565e74]">
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
                      className={`hover:bg-[#eff4ff]/50 transition-colors ${
                        isInConsultation ? "bg-[#006194]/5" : ""
                      }`}
                    >
                      {/* Time */}
                      <td className="pl-5 pr-3 py-3.5 whitespace-nowrap">
                        <span className="text-[13px] font-semibold text-[#0b1c30]">
                          {item.appointment.timeSlot}
                        </span>
                      </td>

                      {/* Patient Details */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#dae2fd] text-[#131b2e] flex items-center justify-center text-[12px] font-bold shrink-0">
                            {initials}
                          </div>
                          <Link
                            href={`/doctor/patients/${item.patient._id}`}
                            className="flex flex-col group"
                          >
                            <span className="text-[14px] font-semibold text-[#0b1c30] group-hover:text-[#006194] leading-snug">
                              {item.patient.name}
                            </span>
                            <span className="text-[11px] text-[#565e74]">
                              {item.patient.mrn} • {item.patient.age}y {item.patient.gender}
                            </span>
                          </Link>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="px-3 py-3.5 max-w-[200px]">
                        <span className="text-[13px] text-[#0b1c30] font-medium truncate block">
                          {item.appointment.reason}
                        </span>
                      </td>

                      {/* Nurse Assessment Status */}
                      <td className="px-3 py-3.5 max-w-[240px]">
                        {item.nurseAssessment ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-[#006194]">
                                BP: {item.nurseAssessment.vitals?.bloodPressure || "120/80"}
                              </span>
                              <span className="text-[11px] text-[#565e74]">
                                HR: {item.nurseAssessment.vitals?.heartRate || 72}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#565e74] truncate" title={item.nurseAssessment.chiefComplaint}>
                              {item.nurseAssessment.chiefComplaint || "Triage completed"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#565e74] italic">
                            Pending Nurse Vitals
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {isUrgent ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-bold">
                            Urgent
                          </span>
                        ) : item.priority === "priority" ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                            Priority
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#565e74] text-[11px] font-medium">
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Wait Time */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="text-[12px] text-[#565e74]">
                          {item.waitingMinutes} mins
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {isWaiting && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[12px] font-medium border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Ready for Doctor
                          </span>
                        )}
                        {isInConsultation && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#cce5ff] text-[#004b73] text-[12px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#006194] animate-pulse" />
                            In Consultation
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[12px] font-medium border border-emerald-200">
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
                            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-[#006194] hover:bg-[#007bb9] text-white text-[12px] font-semibold transition-colors shadow-xs"
                          >
                            Start Consultation
                          </button>
                        )}
                        {isInConsultation && (
                          <button
                            onClick={() => router.push(`/doctor/consultations/${item.patient._id}`)}
                            type="button"
                            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-white border border-[#006194] text-[#006194] hover:bg-[#eff4ff] text-[12px] font-semibold shadow-xs"
                          >
                            Continue
                          </button>
                        )}
                        {isCompleted && (
                          <Link
                            href={`/doctor/patients/${item.patient._id}`}
                            className="text-[#565e74] hover:text-[#006194] text-[12px] font-medium inline-flex items-center gap-0.5"
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
