"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  const [department, setDepartment] = useState("Cardiology / Clinical Pathology");
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
    <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Title & Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#cce5ff] text-[#004b73] text-[11px] uppercase tracking-wider font-semibold">
              Diagnostic Hub
            </span>
            <span className="text-[#bfc7d2]">•</span>
            <span className="text-[12px] text-[#565e74]">Station 4 Orders</span>
          </div>
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Lab & Reports
          </h1>
          <p className="text-[14px] text-[#565e74] mt-0.5">
            Track requested diagnostic tests, monitor phlebotomy workflows, and review finalized reports.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setNewRequisitionModalOpen(true)}
            type="button"
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#006194] text-white hover:bg-[#007bb9] transition-colors text-[13px] font-semibold shadow-xs"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Lab Requisition</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Requests */}
        <div className="p-5 rounded-xl bg-white shadow-xs border border-[#bfc7d2]/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#565e74] uppercase tracking-wider font-medium">
              Total Requests
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#0b1c30]">
                {stats.totalRequests}
              </span>
              <span className="text-[11px] text-[#565e74]">authored</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#eff4ff] flex items-center justify-center text-[#006194]">
            <LabIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Processing in Lab */}
        <div className="p-5 rounded-xl bg-white shadow-xs border border-[#bfc7d2]/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#565e74] uppercase tracking-wider font-medium">
              In Lab Analysis
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#0b1c30]">
                {stats.inAnalysis}
              </span>
              <span className="text-[11px] text-[#565e74]">processing</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <ClockIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Results Ready */}
        <div className="p-5 rounded-xl bg-white shadow-xs border border-[#bfc7d2]/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#006194] uppercase tracking-wider font-semibold">
              Doctor Review
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#006194]">
                {stats.resultsReady}
              </span>
              <span className="text-[11px] text-[#006194]/80 font-medium">awaiting review</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#cce5ff] text-[#006194] flex items-center justify-center font-bold text-[14px]">
            Rx
          </div>
        </div>

        {/* Metric 4: Verified Reports */}
        <div className="p-5 rounded-xl bg-white shadow-xs border border-[#bfc7d2]/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#565e74] uppercase tracking-wider font-medium">
              Pathologist Verified
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#0b1c30]">
                {stats.verified}
              </span>
              <span className="text-[11px] text-[#00873a] font-medium">signed off</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#7ffc97]/40 text-[#006b2c] flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Worksurface */}
      <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col overflow-hidden">
        {/* Filters and Search Toolbar */}
        <div className="p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-[#bfc7d2]/20">
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
                className={`px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors ${
                  filter === st.id
                    ? "bg-[#006194] text-white"
                    : "bg-[#eff4ff] text-[#565e74] hover:bg-[#dce9ff]"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707881]">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, MRN, or test..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#eff4ff] text-[13px] text-[#0b1c30] placeholder:text-[#707881] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#006194] border border-transparent focus:border-[#006194]"
            />
          </form>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#eff4ff]/60 h-9 border-b border-[#bfc7d2]/20">
                <th className="px-5 text-[12px] uppercase tracking-wider text-[#565e74] font-semibold">
                  Patient
                </th>
                <th className="px-4 text-[12px] uppercase tracking-wider text-[#565e74] font-semibold">
                  Test Ordered
                </th>
                <th className="px-4 text-[12px] uppercase tracking-wider text-[#565e74] font-semibold">
                  Department
                </th>
                <th className="px-4 text-[12px] uppercase tracking-wider text-[#565e74] font-semibold">
                  Status
                </th>
                <th className="px-4 text-[12px] uppercase tracking-wider text-[#565e74] font-semibold">
                  Verified By
                </th>
                <th className="px-5 text-[12px] uppercase tracking-wider text-[#565e74] font-semibold text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bfc7d2]/20 text-[13px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#565e74]">
                    Loading lab reports...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#565e74]">
                    No lab orders found matching current filter.
                  </td>
                </tr>
              ) : (
                reports.map((rep) => (
                  <tr key={rep._id} className="hover:bg-[#eff4ff]/40 transition-colors h-14">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#0b1c30]">
                          {rep.patient.name}
                        </span>
                        <span className="text-[11px] text-[#565e74]">
                          {rep.patient.mrn} • {rep.patient.age}y {rep.patient.gender}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#0b1c30]">
                          {rep.testName}
                        </span>
                        <span className="text-[11px] text-[#565e74]">
                          Ordered: {new Date(rep.sampleCollectionDate).toLocaleDateString()}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-[#565e74]">
                      {rep.department}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {rep.status === "verified" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                          Verified
                        </span>
                      ) : rep.status === "finalized" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#cce5ff] text-[#004b73] text-[11px] font-semibold">
                          Result Ready
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[11px] font-medium border border-amber-200">
                          <ClockIcon className="w-3.5 h-3.5" />
                          Processing
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-[#565e74] text-[12px]">
                      {rep.verifiedBy}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap text-right">
                      <Link
                        href={`/doctor/lab/${rep._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#006194] text-[#006194] hover:text-white transition-all text-[12px] font-semibold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4 border border-[#bfc7d2]/40">
            <div className="flex items-center justify-between pb-3 border-b border-[#bfc7d2]/30">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Create Lab Requisition
              </h3>
              <button
                type="button"
                onClick={() => setNewRequisitionModalOpen(false)}
                className="text-[#565e74] hover:text-[#ba1a1a]"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Select Patient *
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                >
                  {patientsList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.mrn}) — {p.gender}, {p.age}y
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Requested Diagnostic Test *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12-Lead Electrocardiogram (ECG) or High-Sensitivity Troponin I"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[12px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                  >
                    <option value="Cardiology Diagnostics">Cardiology Diagnostics</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                    <option value="Biochemistry & Hematology">Biochemistry & Hematology</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[12px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Clinical Indication / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chest discomfort post-exertion, rule out acute coronary syndrome"
                  value={clinicalReason}
                  onChange={(e) => setClinicalReason(e.target.value)}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Lab Technician Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fasting sample; report critical troponin values immediately"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#bfc7d2]/30">
                <button
                  type="button"
                  onClick={() => setNewRequisitionModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-[#565e74] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-[#006194] hover:bg-[#007bb9]"
                >
                  Dispatch to Lab Technician
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
