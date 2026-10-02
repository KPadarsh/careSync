"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CompletedIcon,
  SearchIcon,
  RefreshIcon,
  ChevronRightIcon,
  PrinterIcon,
  CheckIcon,
} from "./LabIcons";

export const CompletedView: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const fetchCompleted = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/lab/completed?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load completed lab reports");
      }
      const data = await res.json();
      setReports(data.reports || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCompleted();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCompleted();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "submitted_for_review":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
            Submitted for Review
          </span>
        );
      case "verified":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            ✓ Verified by Pathologist
          </span>
        );
      case "finalized":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-800 border border-green-200 text-xs font-semibold">
            Finalized &amp; Released
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">
              Completed &amp; Submitted Lab Archive
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#006a68] border border-emerald-200 text-[11px] font-semibold">
              {reports.length} Records
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Requisitions submitted for pathologist review and verified diagnostic reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCompleted}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all"
          >
            <RefreshIcon
              size={14}
              className={refreshing ? "animate-spin text-teal-600" : "text-slate-500"}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Completed Work" },
              { id: "submitted", label: "Submitted for Review" },
              { id: "verified", label: "Pathology Verified" },
              { id: "finalized", label: "Finalized / Released" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? "bg-[#00355f] text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search completed reports by patient, test name, doctor, or verified by..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-24 py-2 text-xs bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0f4c81] focus:bg-white transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#00355f] text-white rounded-md text-xs font-semibold hover:bg-[#0f4c81] transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* COMPLETED WORK TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">{error}</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 px-4">
            <CompletedIcon size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No completed reports found</p>
            <p className="text-xs text-slate-400 mt-1">
              Submit test results from the Analytical Workbench to populate this archive.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Test Name</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Sample ID</th>
                  <th className="py-3.5 px-4">Submitted By</th>
                  <th className="py-3.5 px-4">Pathology Sign-Off</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">View Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedReport(r)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-slate-900 group-hover:text-[#00355f]">
                          {r.testName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {r.department}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-slate-800">
                          {r.patient.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {r.patient.mrn}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-slate-700 font-semibold">
                        {r.sampleId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {r.submittedBy || "Lab Technician"}
                      {r.submittedForReviewAt && (
                        <span className="block text-[10px] text-slate-400">
                          {new Date(r.submittedForReviewAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-medium text-slate-800 block">
                        {r.verifiedBy}
                      </span>
                      {r.verifiedDate && (
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(r.verifiedDate).toLocaleDateString()}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(r.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(r);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#00355f] text-slate-700 hover:text-white text-xs font-semibold transition-colors"
                      >
                        <span>Preview</span>
                        <ChevronRightIcon size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REPORT PREVIEW MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in-50 zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#00355f] text-white flex items-center justify-center font-bold text-xs">
                  CS
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#00355f]">
                    CareSync Clinical Laboratory Report
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {selectedReport.sampleId} • Requisition #{selectedReport._id.substring(0, 8)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Print Report"
                >
                  <PrinterIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex flex-col gap-4 text-xs">
              {/* Patient and Doctor info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Patient Demographics
                  </span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {selectedReport.patient.name}
                  </span>
                  <span className="text-slate-600">
                    MRN: {selectedReport.patient.mrn} • {selectedReport.patient.age}y • {selectedReport.patient.gender} • Blood: {selectedReport.patient.bloodGroup}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Attending Physician
                  </span>
                  <span className="font-bold text-slate-900 block text-sm">
                    {selectedReport.doctor.name}
                  </span>
                  <span className="text-slate-600">
                    {selectedReport.doctor.specialty}
                  </span>
                </div>
              </div>

              {/* Status and summary */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-900">
                <span className="font-semibold">{selectedReport.testName}</span>
                {getStatusBadge(selectedReport.status)}
              </div>

              {/* Parameters Table */}
              <div>
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-2">
                  Analytical Parameters
                </span>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold">
                        <th className="py-2 px-3">Parameter</th>
                        <th className="py-2 px-3">Result Value</th>
                        <th className="py-2 px-3">Unit</th>
                        <th className="py-2 px-3">Reference Interval</th>
                        <th className="py-2 px-3">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReport.results?.map((res: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-medium text-slate-800">{res.parameter}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{res.value}</td>
                          <td className="py-2 px-3 text-slate-500">{res.unit}</td>
                          <td className="py-2 px-3 text-slate-600">{res.referenceRange}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                res.flag === "critical"
                                  ? "bg-rose-100 text-rose-800"
                                  : res.flag === "high"
                                  ? "bg-amber-100 text-amber-800"
                                  : res.flag === "low"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              {res.flag}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Technician and Pathologist remarks */}
              {selectedReport.technicianNotes && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="font-bold text-[11px] text-slate-500 block mb-0.5">
                    Technician Calibration Notes:
                  </span>
                  <p>{selectedReport.technicianNotes}</p>
                </div>
              )}

              {/* Sign off */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Submitted by Technician
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedReport.submittedBy || "Lab Technician"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Pathologist Sign-off
                  </span>
                  <span className="font-bold text-[#00355f]">
                    {selectedReport.verifiedBy}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                Certified Digital Electronic Signature
              </span>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-1.5 bg-[#00355f] text-white rounded-lg text-xs font-semibold hover:bg-[#0f4c81]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
