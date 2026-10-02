"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  IconCalendar,
  IconClock,
  IconCheckCircle,
  IconAlertTriangle,
  IconUser,
  IconPlus,
  IconSearch,
  IconRefresh,
  IconX,
  IconStethoscope,
  IconArrowRight,
  IconFileText,
} from "./DoctorIcons";

interface PatientRef {
  _id: string;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  phone: string;
  bloodGroup: string;
}

interface DoctorRef {
  _id: string;
  name: string;
  specialty: string;
}

interface FollowUpItem {
  _id: string;
  patient: PatientRef;
  doctor: DoctorRef;
  recommendedDate: string;
  reason: string;
  clinicalInstructions: string;
  category: "upcoming" | "today" | "overdue" | "completed";
  status: "pending" | "scheduled" | "completed" | "missed";
  scheduledAppointment?: {
    _id: string;
    date: string;
    timeSlot: string;
    status: string;
  } | null;
  createdAt: string;
}

export function FollowUpsView() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    upcoming: 0,
    today: 0,
    overdue: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<FollowUpItem | null>(null);

  // New Follow-up Modal states
  const [showNewModal, setShowNewModal] = useState(false);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [clinicalReason, setClinicalReason] = useState("");
  const [clinicalInstructions, setClinicalInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");

  const fetchFollowUps = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("filter", activeFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/doctor/follow-ups?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps || []);
        if (data.counts) setCounts(data.counts);
        if (data.followUps && data.followUps.length > 0 && !selectedItem) {
          setSelectedItem(data.followUps[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [activeFilter]);

  const loadPatientsForModal = async () => {
    try {
      const res = await fetch("/api/doctor/patients");
      if (res.ok) {
        const data = await res.json();
        setPatientsList(data.patients || []);
        if (data.patients && data.patients.length > 0) {
          setSelectedPatientId(data.patients[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load patients for modal:", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFollowUps();
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !targetDate || !clinicalReason.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/doctor/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          recommendedDate: targetDate,
          reason: clinicalReason.trim(),
          clinicalInstructions: clinicalInstructions.trim() || "Follow up after completing course.",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActionSuccess(data.message || "Follow-up instructions logged successfully");
        setShowNewModal(false);
        setClinicalReason("");
        setClinicalInstructions("");
        setTargetDate("");
        fetchFollowUps();
        setTimeout(() => setActionSuccess(""), 5000);
      }
    } catch (err) {
      console.error("Error creating follow-up:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysDiff = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.round((target - now) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === -1) return "1 day overdue";
    return `${Math.abs(diffDays)} days overdue`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Banner Alert */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-emerald-600 hover:text-emerald-800">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Area */}
      <PageHeader
        title="Follow-ups"
        description="Manage patient follow-ups and continuity of care. Instructions sync automatically with Reception."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            {counts.all} Total Tracked
          </span>
        }
        actions={
          <button
            onClick={() => {
              loadPatientsForModal();
              setShowNewModal(true);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            <span>New Follow-up</span>
          </button>
        }
      />

      {/* Summary Metric Bento Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Due Today */}
        <div
          onClick={() => setActiveFilter("today")}
          className={`cursor-pointer rounded-xl p-4 bg-white shadow-xs flex items-center justify-between transition-all hover:bg-slate-50 border ${
            activeFilter === "today" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-slate-200/80"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Due Today</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{counts.today}</span>
              <span className="text-xs text-slate-400 font-medium">scheduled</span>
            </div>
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Ready for consult
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/70 flex items-center justify-center shrink-0">
            <IconCalendar className="w-5 h-5" />
          </div>
        </div>

        {/* Upcoming */}
        <div
          onClick={() => setActiveFilter("upcoming")}
          className={`cursor-pointer rounded-xl p-4 bg-white shadow-xs flex items-center justify-between transition-all hover:bg-slate-50 border ${
            activeFilter === "upcoming" ? "border-blue-600 ring-2 ring-blue-600/20" : "border-slate-200/80"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Next 7 Days</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{counts.upcoming}</span>
              <span className="text-xs text-slate-400 font-medium">upcoming</span>
            </div>
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-slate-500">
              <IconClock className="w-3.5 h-3.5 text-blue-600" />
              Pre-consultation queue
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
            <IconCalendar className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setActiveFilter("overdue")}
          className={`cursor-pointer rounded-xl p-4 bg-white shadow-xs flex items-center justify-between transition-all hover:bg-slate-50 border ${
            activeFilter === "overdue" ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/80"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-rose-600 font-semibold">Overdue</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-rose-700">{counts.overdue}</span>
              <span className="text-xs text-rose-500 font-medium">pending</span>
            </div>
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-rose-700">
              <IconAlertTriangle className="w-3.5 h-3.5" />
              Requires reception outreach
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200/70 flex items-center justify-center shrink-0">
            <IconAlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveFilter("completed")}
          className={`cursor-pointer rounded-xl p-4 bg-white shadow-xs flex items-center justify-between transition-all hover:bg-slate-50 border ${
            activeFilter === "completed" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-slate-200/80"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Completed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">{counts.completed}</span>
              <span className="text-xs text-slate-400 font-medium">concluded</span>
            </div>
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-emerald-700">
              <IconCheckCircle className="w-3.5 h-3.5" />
              100% charted
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
            <IconCheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <IconSearch className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient by name or MRN..."
            className="w-full h-9 pl-9 pr-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </form>

        <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
          {[
            { id: "all", label: "All", count: counts.all },
            { id: "upcoming", label: "Upcoming", count: counts.upcoming },
            { id: "today", label: "Due Today", count: counts.today },
            { id: "overdue", label: "Overdue", count: counts.overdue },
            { id: "completed", label: "Completed", count: counts.completed },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeFilter === tab.id ? "bg-white/20 text-white" : "bg-white text-slate-700 shadow-xs"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Workspace: Split View Table + Dossier Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Follow-up Table (7 Cols) */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconFileText className="w-4 h-4 text-slate-500" />
              <span className="text-xs sm:text-sm font-semibold text-slate-900">Follow-up Roster</span>
            </div>
            <span className="text-xs text-slate-400">
              Showing {followUps.length} record{followUps.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-sm text-slate-400">
                <IconRefresh className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                Loading follow-ups...
              </div>
            ) : followUps.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                <IconCalendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No follow-ups found</p>
                <p className="text-xs text-slate-400 mt-1">No clinical follow-ups matching current criteria</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200/80">
                    <th className="py-2.5 px-3.5">Patient Details</th>
                    <th className="py-2.5 px-3">Target Date</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Clinical Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {followUps.map((item) => {
                    const isSelected = selectedItem?._id === item._id;
                    const diffText = getDaysDiff(item.recommendedDate);

                    return (
                      <tr
                        key={item._id}
                        onClick={() => setSelectedItem(item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-sky-50/70" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {item.patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
                                {item.patient.name}
                                {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600" />}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                #{item.patient.mrn} • {item.patient.age}y {item.patient.gender}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className="font-semibold text-slate-800 leading-snug">
                            {new Date(item.recommendedDate).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              item.category === "today"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : item.category === "overdue"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : item.category === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {diffText}
                          </span>
                        </td>

                        <td className="py-3 px-3 hidden md:table-cell">
                          <p className="text-slate-800 line-clamp-1">{item.reason}</p>
                          <p className="text-[11px] text-slate-400 truncate">{item.clinicalInstructions}</p>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${
                              item.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : item.category === "overdue"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : item.category === "today"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right pr-4 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedItem(item);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-900 hover:text-white transition-colors"
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Follow-up Detail Panel / Dossier Drawer (5 Cols) */}
        <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4 sticky top-20">
          {selectedItem ? (
            <>
              {/* Drawer Header */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Clinical Dossier</span>
                  <h2 className="text-base font-bold text-slate-900">{selectedItem.patient.name}</h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    MRN: {selectedItem.patient.mrn} • {selectedItem.patient.age} yrs • {selectedItem.patient.gender} • Blood: {selectedItem.patient.bloodGroup}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                  <IconCalendar className="w-3.5 h-3.5" />
                  Target: {new Date(selectedItem.recommendedDate).toLocaleDateString()}
                </span>
              </div>

              {/* Quick Patient Encounter Details */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Assigned Clinician</span>
                  <span className="font-semibold text-slate-800">{selectedItem.doctor.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Specialty</span>
                  <span className="font-medium text-slate-700">{selectedItem.doctor.specialty}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Patient Phone</span>
                  <span className="font-medium text-slate-700 font-mono">{selectedItem.patient.phone}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Reception Status</span>
                  <span className="font-semibold capitalize text-slate-800">{selectedItem.status}</span>
                </div>
              </div>

              {/* Doctor's Clinical Intent / Plan */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1.5">
                    <IconStethoscope className="w-3.5 h-3.5 text-blue-600" />
                    Doctor&apos;s Clinical Plan
                  </label>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                    Physician Signed
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800 leading-relaxed">
                  <p className="font-semibold text-slate-900 mb-1">Reason for Follow-up:</p>
                  <p className="italic text-slate-700 mb-2">&ldquo;{selectedItem.reason}&rdquo;</p>
                  <p className="font-semibold text-slate-900 mb-1">Clinical Instructions:</p>
                  <p className="text-slate-600">&ldquo;{selectedItem.clinicalInstructions}&rdquo;</p>
                  <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Auth: {selectedItem.doctor.name}</span>
                    <span>Target: {new Date(selectedItem.recommendedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Slot Schedule & Diagnostic Prerequisite */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[11px] text-slate-500">Appointment Time</span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5">
                    {selectedItem.scheduledAppointment
                      ? `${selectedItem.scheduledAppointment.timeSlot || "Pending slot"}`
                      : "Awaiting Receptionist"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Consultation Room 302</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col">
                  <span className="text-[11px] text-slate-500">Handoff Workflow</span>
                  <span className="text-xs font-semibold text-blue-600 mt-0.5">
                    {selectedItem.status === "scheduled" ? "Booked by Reception" : "In Reception Queue"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Automated sync</span>
                </div>
              </div>

              {/* Action Link to Patient Chart */}
              <div className="pt-1">
                <Link
                  href={`/doctor/patients/${selectedItem.patient._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition-colors"
                >
                  <IconUser className="w-3.5 h-3.5" />
                  <span>Open Full Clinical Chart</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-sm text-slate-400">
              <IconFileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Select a follow-up record to view the clinical dossier
            </div>
          )}
        </div>
      </div>

      {/* New Follow-up Instruction Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCalendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-slate-900">Issue Follow-up Instruction</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  {patientsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (#{p.mrn}) — {p.age}y {p.gender}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Follow-up Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Reason</label>
                <input
                  type="text"
                  value={clinicalReason}
                  onChange={(e) => setClinicalReason(e.target.value)}
                  placeholder="e.g. BP medication titration review (Day 14)"
                  className="w-full h-9 px-3 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Instructions &amp; Diagnostic Prerequisite</label>
                <textarea
                  value={clinicalInstructions}
                  onChange={(e) => setClinicalInstructions(e.target.value)}
                  placeholder="e.g. Check fasting lipid panel 12 hours prior. Fasting blood sugar report required."
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-xs sm:text-sm bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-start gap-2 border border-slate-200/60">
                <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Once saved, this follow-up requirement is immediately dispatched to the Receptionist queue for telephone outreach and calendar booking.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? "Saving..." : "Authorize Follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
