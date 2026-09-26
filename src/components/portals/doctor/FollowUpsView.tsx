"use client";

import React, { useState, useEffect } from "react";
import Link from "next/navigation";
import {
  IconCalendar,
  IconClock,
  IconCheckCircle,
  IconAlertTriangle,
  IconSearch,
  IconPlus,
  IconStethoscope,
  IconFileText,
  IconChevronRight,
  IconRefresh,
  IconUser,
  IconArrowRight,
  IconX,
} from "./DoctorIcons";

interface FollowUpItem {
  _id: string;
  recommendedDate: string;
  reason: string;
  clinicalInstructions: string;
  status: "pending" | "scheduled" | "completed" | "cancelled";
  category: "today" | "upcoming" | "overdue" | "completed";
  scheduledAppointment: {
    date: string;
    timeSlot: string;
    status: string;
  } | null;
  patient: {
    _id: string;
    name: string;
    mrn: string;
    age: number;
    gender: string;
    bloodGroup: string;
    phone: string;
    avatar?: string;
  };
  doctor: {
    name: string;
    specialty: string;
  };
}

export function FollowUpsView() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    today: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "today" | "upcoming" | "overdue" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<FollowUpItem | null>(null);

  // New follow-up modal state
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
      const url = new URL("/api/doctor/follow-ups", window.location.origin);
      if (activeFilter !== "all") url.searchParams.set("filter", activeFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps || []);
        if (data.counts) setCounts(data.counts);
        if (data.followUps?.length > 0 && !selectedItem) {
          setSelectedItem(data.followUps[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientsForModal = async () => {
    try {
      const res = await fetch("/api/doctor/patients");
      if (res.ok) {
        const data = await res.json();
        setPatientsList(data.patients || []);
        if (data.patients?.length > 0) {
          setSelectedPatientId(data.patients[0]._id);
        }
      }
    } catch (err) {
      console.error("Error loading patients:", err);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [activeFilter]);

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
    <div className="space-y-6">
      {/* Top Notification / Success Banner */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-tertiary-fixed/30 border border-tertiary-fixed-dim text-on-tertiary-fixed flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconCheckCircle className="w-5 h-5 text-tertiary shrink-0" />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess("")} className="text-tertiary hover:opacity-75">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Command & Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
              <IconCalendar className="w-4 h-4 text-primary" />
            </span>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Follow-ups</h1>
          </div>
          <p className="text-sm text-secondary">
            Manage upcoming patient follow-ups and consultation continuity. Instructions are queued for Receptionist booking.
          </p>
        </div>

        {/* Quick Search & Actions */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary">
              <IconSearch className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient by name or MRN..."
              className="w-full h-9 pl-9 pr-4 bg-white border border-outline-variant/50 rounded-lg text-sm text-on-surface placeholder:text-outline shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            />
          </form>

          <button
            onClick={() => {
              loadPatientsForModal();
              setShowNewModal(true);
            }}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-sm transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            <span>New Follow-up</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Bento Grid (4 Compact Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Due Today */}
        <div
          onClick={() => setActiveFilter("today")}
          className={`cursor-pointer rounded-xl p-4 bg-white shadow-sm flex items-center justify-between transition-all hover:bg-surface-container-low/60 border ${
            activeFilter === "today" ? "border-amber-500 ring-2 ring-amber-500/20" : "border-outline-variant/30"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-secondary font-medium">Due Today</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-on-surface">{counts.today}</span>
              <span className="text-xs text-secondary font-medium">patient scheduled</span>
            </div>
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Ready for consultation
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <IconCalendar className="w-5 h-5" />
          </div>
        </div>

        {/* Upcoming */}
        <div
          onClick={() => setActiveFilter("upcoming")}
          className={`cursor-pointer rounded-xl p-4 bg-white shadow-sm flex items-center justify-between transition-all hover:bg-surface-container-low/60 border ${
            activeFilter === "upcoming" ? "border-primary ring-2 ring-primary/20" : "border-outline-variant/30"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-secondary font-medium">Next 7 Days</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-primary">{counts.upcoming}</span>
              <span className="text-xs text-secondary font-medium">clinical milestones</span>
            </div>
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-secondary">
              <IconClock className="w-3.5 h-3.5 text-primary" />
              Pre-consultation queue
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center">
            <IconCalendar className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setActiveFilter("overdue")}
          className={`cursor-pointer rounded-xl p-4 bg-white shadow-sm flex items-center justify-between transition-all hover:bg-surface-container-low/60 border ${
            activeFilter === "overdue" ? "border-error ring-2 ring-error/20" : "border-outline-variant/30"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-error font-medium">Overdue</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-error">{counts.overdue}</span>
              <span className="text-xs text-error/80 font-medium">attention required</span>
            </div>
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-error">
              <IconAlertTriangle className="w-3.5 h-3.5" />
              Requires receptionist outreach
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center">
            <IconAlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveFilter("completed")}
          className={`cursor-pointer rounded-xl p-4 bg-white shadow-sm flex items-center justify-between transition-all hover:bg-surface-container-low/60 border ${
            activeFilter === "completed" ? "border-tertiary ring-2 ring-tertiary/20" : "border-outline-variant/30"
          }`}
        >
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-secondary font-medium">Completed</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-tertiary">{counts.completed}</span>
              <span className="text-xs text-secondary font-medium">this month</span>
            </div>
            <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-medium text-tertiary">
              <IconCheckCircle className="w-3.5 h-3.5" />
              100% charted
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-tertiary-fixed/40 text-tertiary flex items-center justify-center">
            <IconCheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Pills Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2 rounded-xl border border-outline-variant/30 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeFilter === "all"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container-low text-secondary hover:text-on-surface"
            }`}
          >
            <span>All Follow-ups</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilter === "all" ? "bg-white/20 text-white" : "bg-surface-container text-on-secondary-container"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("upcoming")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeFilter === "upcoming"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container-low text-secondary hover:text-on-surface"
            }`}
          >
            <span>Upcoming</span>
            <span className="px-1.5 py-0.2 rounded-full bg-surface-container text-on-secondary-container text-[10px]">
              {counts.upcoming}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("today")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeFilter === "today"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container-low text-secondary hover:text-on-surface"
            }`}
          >
            <span>Due Today</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
              {counts.today}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("overdue")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeFilter === "overdue"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container-low text-secondary hover:text-on-surface"
            }`}
          >
            <span>Overdue</span>
            <span className="px-1.5 py-0.2 rounded-full bg-error-container text-error text-[10px] font-semibold">
              {counts.overdue}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              activeFilter === "completed"
                ? "bg-primary text-white shadow-sm"
                : "bg-surface-container-low text-secondary hover:text-on-surface"
            }`}
          >
            <span>Completed</span>
            <span className="px-1.5 py-0.2 rounded-full bg-tertiary-fixed/50 text-on-tertiary-fixed-variant text-[10px]">
              {counts.completed}
            </span>
          </button>
        </div>

        {/* Legend Indicator */}
        <div className="hidden xl:flex items-center gap-4 px-2 text-xs text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary"></span> Upcoming
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Due Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-error"></span> Overdue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tertiary"></span> Completed
          </span>
        </div>
      </div>

      {/* Main Grid Workspace: Split View Table + Dossier Drawer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Follow-up Table Surface (7 Cols) */}
        <div className="xl:col-span-7 bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-surface-container-low/70 border-b border-outline-variant/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconFileText className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold text-on-surface">Scheduled Follow-up Roster</span>
            </div>
            <span className="text-xs text-secondary">
              Showing {followUps.length} record{followUps.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-sm text-secondary">
                <IconRefresh className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                Loading follow-ups...
              </div>
            ) : followUps.length === 0 ? (
              <div className="py-16 text-center text-sm text-secondary">
                <IconCalendar className="w-8 h-8 mx-auto text-outline mb-2" />
                <p className="font-semibold text-on-surface">No follow-ups found</p>
                <p className="text-xs text-secondary mt-1">No clinical follow-ups matching current criteria</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/40 text-secondary uppercase text-[11px] font-semibold border-b border-outline-variant/20">
                    <th className="py-2.5 px-3.5">Patient Details</th>
                    <th className="py-2.5 px-3">Target Date</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Clinical Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-xs">
                  {followUps.map((item) => {
                    const isSelected = selectedItem?._id === item._id;
                    const diffText = getDaysDiff(item.recommendedDate);

                    return (
                      <tr
                        key={item._id}
                        onClick={() => setSelectedItem(item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary-fixed/20 hover:bg-primary-fixed/30"
                            : "hover:bg-surface-container-low/50"
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0">
                              {item.patient.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-on-surface truncate flex items-center gap-1.5">
                                {item.patient.name}
                                {isSelected && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary"></span>}
                              </p>
                              <p className="text-[11px] text-secondary font-mono">
                                #{item.patient.mrn} • {item.patient.age}y {item.patient.gender}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <p className="font-semibold text-on-surface leading-snug">
                            {new Date(item.recommendedDate).toLocaleDateString("en-US", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              item.category === "today"
                                ? "bg-amber-100 text-amber-800 font-semibold"
                                : item.category === "overdue"
                                ? "bg-error-container text-error font-semibold"
                                : item.category === "completed"
                                ? "bg-tertiary-fixed/30 text-tertiary"
                                : "bg-surface-container text-on-secondary-container"
                            }`}
                          >
                            {diffText}
                          </span>
                        </td>

                        <td className="py-3 px-3 hidden md:table-cell">
                          <p className="text-on-surface line-clamp-1">{item.reason}</p>
                          <p className="text-[11px] text-secondary truncate">{item.clinicalInstructions}</p>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                              item.status === "completed"
                                ? "bg-tertiary-fixed/40 text-tertiary"
                                : item.category === "overdue"
                                ? "bg-error-container text-error"
                                : item.category === "today"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-surface-container text-primary"
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
                            className="px-2.5 py-1 rounded bg-surface-container text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors"
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
        <div className="xl:col-span-5 bg-white rounded-xl border border-outline-variant/30 shadow-sm p-5 flex flex-col gap-4 sticky top-20">
          {selectedItem ? (
            <>
              {/* Drawer Header */}
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">Clinical Dossier</span>
                  <h2 className="text-lg font-bold text-on-surface">{selectedItem.patient.name}</h2>
                  <p className="text-xs text-secondary font-mono mt-0.5">
                    MRN: {selectedItem.patient.mrn} • {selectedItem.patient.age} yrs • {selectedItem.patient.gender} • Blood Group: {selectedItem.patient.bloodGroup}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-fixed text-on-primary-fixed">
                  <IconCalendar className="w-3.5 h-3.5" />
                  Target: {new Date(selectedItem.recommendedDate).toLocaleDateString()}
                </span>
              </div>

              {/* Quick Patient Encounter Badge */}
              <div className="p-3.5 rounded-lg bg-surface-container-low flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary">Assigned Clinician</span>
                  <span className="font-semibold text-primary">{selectedItem.doctor.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary">Specialty</span>
                  <span className="font-medium text-on-surface">{selectedItem.doctor.specialty}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary">Patient Phone</span>
                  <span className="font-medium text-on-surface font-mono">{selectedItem.patient.phone}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-secondary">Reception Status</span>
                  <span className="font-semibold capitalize text-on-surface">{selectedItem.status}</span>
                </div>
              </div>

              {/* Doctor's Clinical Intent / Plan (Strict Read-Only) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider text-secondary font-semibold flex items-center gap-1.5">
                    <IconStethoscope className="w-3.5 h-3.5 text-primary" />
                    Doctor&apos;s Clinical Plan &amp; Protocol
                  </label>
                  <span className="text-[10px] font-mono text-tertiary bg-tertiary-fixed/30 px-2 py-0.5 rounded font-medium">
                    Physician Signed
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-surface-container-low text-xs text-on-surface leading-relaxed">
                  <p className="font-semibold text-on-surface mb-1">Reason for Follow-up:</p>
                  <p className="italic text-on-surface/90 mb-2">&ldquo;{selectedItem.reason}&rdquo;</p>
                  <p className="font-semibold text-on-surface mb-1">Clinical Instructions:</p>
                  <p className="text-secondary">&ldquo;{selectedItem.clinicalInstructions}&rdquo;</p>
                  <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-secondary">
                    <span>Auth: {selectedItem.doctor.name}</span>
                    <span>Target: {new Date(selectedItem.recommendedDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Slot Schedule & Diagnostic Prerequisite */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                  <span className="text-[11px] text-secondary">Appointment Time</span>
                  <span className="text-xs font-semibold text-on-surface mt-0.5">
                    {selectedItem.scheduledAppointment
                      ? `${selectedItem.scheduledAppointment.timeSlot || "Pending slot"}`
                      : "Awaiting Receptionist"}
                  </span>
                  <span className="text-[10px] text-secondary mt-0.5">Consultation Room 302</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-low flex flex-col">
                  <span className="text-[11px] text-secondary">Handoff Workflow</span>
                  <span className="text-xs font-semibold text-primary mt-0.5">
                    {selectedItem.status === "scheduled" ? "Booked by Reception" : "In Reception Queue"}
                  </span>
                  <span className="text-[10px] text-secondary mt-0.5">Automated sync</span>
                </div>
              </div>

              {/* Action Link to Patient Chart */}
              <div className="pt-2">
                <a
                  href={`/doctor/patients/${selectedItem.patient._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container shadow-sm transition-colors"
                >
                  <IconUser className="w-3.5 h-3.5" />
                  <span>Open Full Clinical Chart</span>
                  <IconArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-sm text-secondary">
              <IconFileText className="w-8 h-8 mx-auto text-outline mb-2" />
              Select a follow-up record to view the clinical dossier
            </div>
          )}
        </div>
      </div>

      {/* New Follow-up Instruction Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconCalendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-on-surface">Issue Follow-up Instruction</h3>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Select Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full h-10 px-3 border border-outline-variant/50 rounded-lg text-sm bg-white text-on-surface focus:outline-none focus:border-primary"
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
                <label className="block text-xs font-semibold text-on-surface mb-1">Target Follow-up Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full h-10 px-3 border border-outline-variant/50 rounded-lg text-sm bg-white text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Clinical Reason</label>
                <input
                  type="text"
                  value={clinicalReason}
                  onChange={(e) => setClinicalReason(e.target.value)}
                  placeholder="e.g. BP medication titration review (Day 14)"
                  className="w-full h-10 px-3 border border-outline-variant/50 rounded-lg text-sm bg-white text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Clinical Instructions &amp; Diagnostic Prerequisite</label>
                <textarea
                  value={clinicalInstructions}
                  onChange={(e) => setClinicalInstructions(e.target.value)}
                  placeholder="e.g. Check fasting lipid panel 12 hours prior. Fasting blood sugar report required."
                  rows={3}
                  className="w-full p-3 border border-outline-variant/50 rounded-lg text-sm bg-white text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg text-xs text-secondary flex items-start gap-2">
                <IconCheckCircle className="w-4 h-4 text-tertiary shrink-0 mt-0.5" />
                <span>
                  Once saved, this follow-up requirement is immediately dispatched to the Receptionist queue for telephone outreach and calendar booking.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-secondary hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm"
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
