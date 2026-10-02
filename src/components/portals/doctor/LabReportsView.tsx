"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SearchIcon,
  PlusIcon,
  CloseIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  LabIcon,
  ClockIcon,
} from "./DoctorIcons";

interface LabReportItem {
  _id: string;
  testName: string;
  department: string;
  sampleCollectionDate: string;
  verifiedDate?: string;
  status: "verified" | "finalized" | "pending" | "in-progress";
  summary: string;
  verifiedBy: string;
  resultsCount: number;
  patient: {
    _id: string;
    name: string;
    mrn: string;
    age: number;
    gender: string;
    bloodGroup: string;
  };
}

export const LabReportsView: React.FC = () => {
  const [reports, setReports] = useState<LabReportItem[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    inAnalysis: 0,
    resultsReady: 0,
    verified: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newRequisitionModalOpen, setNewRequisitionModalOpen] = useState(false);

  // New Requisition Form State
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [patientId, setPatientId] = useState("");
  const [testName, setTestName] = useState("");
  const [department, setDepartment] = useState("Cardiology Diagnostics");
  const [priority, setPriority] = useState<"routine" | "urgent" | "stat">("routine");
  const [clinicalReason, setClinicalReason] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", filter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/doctor/lab?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setReports(json.reports || []);
        if (json.stats) setStats(json.stats);
      }
    } catch (err) {
      console.error("Failed to load lab reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await fetch("/api/doctor/patients");
        if (res.ok) {
          const json = await res.json();
          setPatientsList(json.patients || []);
          if (json.patients && json.patients.length > 0) {
            setPatientId(json.patients[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadPatients();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      alert("Please specify test name");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/doctor/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          testName,
          department,
          priority,
          clinicalReason,
          instructions,
        }),
      });

      if (res.ok) {
        setNewRequisitionModalOpen(false);
        setTestName("");
        setClinicalReason("");
        setInstructions("");
        fetchReports();
      } else {
        alert("Failed to submit lab requisition");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting lab requisition");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Title & Action Row */}
      <PageHeader
        title="Lab & Reports"
        description="Track requested diagnostic tests, monitor phlebotomy workflows, and review finalized reports."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Diagnostic Hub
          </span>
        }
        actions={
          <button
            onClick={() => setNewRequisitionModalOpen(true)}
            type="button"
            className="flex items-center gap-2 h-9 px-3.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors text-xs font-semibold shadow-xs"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Lab Requisition</span>
          </button>
        }
      />

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Requests */}
        <div className="p-4 rounded-xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Total Requests
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">
                {stats.totalRequests}
              </span>
              <span className="text-xs text-slate-400">authored</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
            <LabIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Processing in Lab */}
        <div className="p-4 rounded-xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              In Lab Analysis
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">
                {stats.inAnalysis}
              </span>
              <span className="text-xs text-slate-400">processing</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center justify-center shrink-0">
            <ClockIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Results Ready */}
        <div className="p-4 rounded-xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-sky-700 uppercase tracking-wider font-semibold">
              Doctor Review
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-sky-700">
                {stats.resultsReady}
              </span>
              <span className="text-xs text-sky-600 font-medium">ready</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/70 flex items-center justify-center font-bold text-xs shrink-0">
            LAB
          </div>
        </div>

        {/* Metric 4: Verified Reports */}
        <div className="p-4 rounded-xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
              Pathologist Verified
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-900">
                {stats.verified}
              </span>
              <span className="text-xs text-emerald-700 font-medium">signed off</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Worksurface */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 flex flex-col overflow-hidden">
        {/* Filters and Search Toolbar */}
        <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: "All Statuses" },
              { id: "requested", label: "Requested" },
              { id: "processing", label: "Processing" },
              { id: "ready", label: "Result Ready" },
              { id: "verified", label: "Verified" },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilter(st.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === st.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, MRN, or test..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 border border-slate-200 focus:border-blue-500 transition-all"
            />
          </form>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/70 h-9 border-b border-slate-100">
                <th className="px-5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Patient
                </th>
                <th className="px-4 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Test Ordered
                </th>
                <th className="px-4 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Department
                </th>
                <th className="px-4 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Status
                </th>
                <th className="px-4 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  Verified By
                </th>
                <th className="px-5 text-[11px] uppercase tracking-wider text-slate-500 font-semibold text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    Loading lab reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
                    No lab orders found matching current filter.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-slate-50/70 transition-colors h-14">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {rep.patient.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {rep.patient.mrn} • {rep.patient.age}y {rep.patient.gender}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {rep.testName}
                        </span>
                        <span className="text-xs text-slate-400">
                          Ordered: {new Date(rep.sampleCollectionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                      {rep.department}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {rep.status === "verified" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                      ) : rep.status === "finalized" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 text-[11px] font-semibold border border-sky-200">
                          Result Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[11px] font-medium border border-amber-200">
                          <ClockIcon className="w-3.5 h-3.5" />
                          Processing
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                      {rep.verifiedBy || "Pending Verification"}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <Link
                        href={`/doctor/lab/${rep._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white transition-all text-xs font-semibold text-slate-700"
                      >
                        <span>View Report</span>
                        <ChevronRightIcon className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW LAB REQUISITION MODAL */}
      {newRequisitionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Create Lab Requisition
              </h3>
              <button
                type="button"
                onClick={() => setNewRequisitionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Patient *
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full h-9 px-3 bg-white rounded-lg text-xs sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {patientsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.mrn}) — {p.gender}, {p.age}y
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Requested Diagnostic Test *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12-Lead Electrocardiogram (ECG) or High-Sensitivity Troponin I"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full h-9 px-3 bg-white rounded-lg text-xs sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-9 px-3 bg-white rounded-lg text-xs sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Cardiology Diagnostics">Cardiology Diagnostics</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                    <option value="Biochemistry & Hematology">Biochemistry & Hematology</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full h-9 px-3 bg-white rounded-lg text-xs sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinical Indication / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest discomfort post-exertion, rule out acute coronary syndrome"
                  value={clinicalReason}
                  onChange={(e) => setClinicalReason(e.target.value)}
                  className="w-full h-9 px-3 bg-white rounded-lg text-xs sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Lab Technician Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fasting sample; report critical troponin values immediately"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full h-9 px-3 bg-white rounded-lg text-xs sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewRequisitionModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? "Dispatching..." : "Dispatch to Lab Technician"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
