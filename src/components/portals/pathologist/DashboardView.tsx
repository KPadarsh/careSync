"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MicroscopeIcon,
  ReportsIcon,
  VerifiedIcon,
  AlertTriangleIcon,
  ClockIcon,
  RefreshCwIcon,
  CheckCircleIcon,
} from "./PathologistIcons";

export function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"awaiting" | "underReview" | "correction" | "verified">("awaiting");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/pathologist/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load pathologist dashboard.");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6 lg:p-10 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-500">Loading pathology workstation telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 p-6 lg:p-10 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md">
          <p className="text-sm font-semibold text-red-800">Operational Error</p>
          <p className="text-xs text-red-600 mt-1">{error || "Could not retrieve data."}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { metrics, queues, pathologist } = data;

  const currentList =
    activeTab === "awaiting"
      ? queues.awaiting
      : activeTab === "underReview"
      ? queues.underReview
      : activeTab === "correction"
      ? queues.correction
      : queues.verified;

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-8 max-w-7xl mx-auto w-full">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Clinical Laboratory &amp; Pathology Directorate
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002444] tracking-tight">
            Diagnostic Pathology Workstation
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Certified sign-off bench for Dr. Sunita Patil, MD • Review pending chemistry, hematology, and endocrinology requisitions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#00355f] hover:border-slate-300 text-xs font-medium shadow-sm transition-all"
          >
            <RefreshCwIcon className="w-4 h-4 text-slate-500" />
            <span>Refresh Workbench</span>
          </button>

          <Link
            href="/pathologist/reports"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00355f] text-white hover:bg-[#002444] text-xs font-semibold shadow-md shadow-blue-900/20 transition-all"
          >
            <ReportsIcon className="w-4 h-4 text-[#94f2ef]" />
            <span>Open Review Queue ({metrics.awaitingReviewCount})</span>
          </Link>
        </div>
      </div>

      {/* ================= 4 OPERATIONAL METRICS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Awaiting Review */}
        <button
          onClick={() => setActiveTab("awaiting")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === "awaiting"
              ? "bg-amber-50/60 border-amber-300 shadow-md ring-2 ring-amber-400/30"
              : "bg-white border-slate-200/80 hover:border-amber-200 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
              Awaiting Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <ClockIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#002444]">
            {metrics.awaitingReviewCount}
          </div>
          <div className="text-xs text-amber-700 mt-1 flex items-center gap-1 font-medium">
            <span>Requires clinical sign-off</span>
          </div>
        </button>

        {/* Metric 2: Under Review */}
        <button
          onClick={() => setActiveTab("underReview")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === "underReview"
              ? "bg-blue-50/60 border-blue-300 shadow-md ring-2 ring-blue-400/30"
              : "bg-white border-slate-200/80 hover:border-blue-200 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">
              Under Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <MicroscopeIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#002444]">
            {metrics.underReviewCount}
          </div>
          <div className="text-xs text-blue-700 mt-1 font-medium">
            Active interpretation in progress
          </div>
        </button>

        {/* Metric 3: Correction Required */}
        <button
          onClick={() => setActiveTab("correction")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === "correction"
              ? "bg-rose-50/60 border-rose-300 shadow-md ring-2 ring-rose-400/30"
              : "bg-white border-slate-200/80 hover:border-rose-200 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">
              Correction Required
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#002444]">
            {metrics.correctionRequiredCount}
          </div>
          <div className="text-xs text-rose-700 mt-1 font-medium">
            Redraw / dilution flagged to lab
          </div>
        </button>

        {/* Metric 4: Recently Verified */}
        <button
          onClick={() => setActiveTab("verified")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === "verified"
              ? "bg-emerald-50/60 border-emerald-300 shadow-md ring-2 ring-emerald-400/30"
              : "bg-white border-slate-200/80 hover:border-emerald-200 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Recently Verified
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <VerifiedIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-[#002444]">
            {metrics.verifiedCount}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-medium">
            Finalized &amp; released to physicians
          </div>
        </button>
      </div>

      {/* ================= WORKBENCH QUEUE SECTION ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Queue Switcher Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("awaiting")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "awaiting"
                  ? "bg-[#00355f] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Awaiting Review ({queues.awaiting.length})
            </button>
            <button
              onClick={() => setActiveTab("underReview")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "underReview"
                  ? "bg-[#00355f] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Under Review ({queues.underReview.length})
            </button>
            <button
              onClick={() => setActiveTab("correction")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "correction"
                  ? "bg-[#00355f] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Correction Required ({queues.correction.length})
            </button>
            <button
              onClick={() => setActiveTab("verified")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === "verified"
                  ? "bg-[#00355f] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Recently Certified ({queues.verified.length})
            </button>
          </div>

          <Link
            href={activeTab === "verified" ? "/pathologist/verified" : "/pathologist/reports"}
            className="text-xs font-semibold text-[#006a68] hover:text-[#004f4e] flex items-center gap-1 self-end sm:self-auto"
          >
            <span>View Full Roster</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Table View */}
        {currentList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <CheckCircleIcon className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Queue is clear</p>
            <p className="text-xs text-slate-400">
              No items currently require attention in this operational category.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3.5 px-4 sm:px-6">Priority</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Test &amp; Department</th>
                  <th className="py-3.5 px-4">Specimen / Sample</th>
                  <th className="py-3.5 px-4">Analytical Findings</th>
                  <th className="py-3.5 px-4">Submitted By</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentList.map((item: any) => {
                  const isStat = item.priority === "stat";
                  const isUrgent = item.priority === "urgent";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isStat ? "bg-rose-50/30" : ""
                      }`}
                    >
                      {/* Priority */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                        {isStat ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                            STAT
                          </span>
                        ) : isUrgent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            URGENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            ROUTINE
                          </span>
                        )}
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{item.patient.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.patient.mrn} • {item.patient.gender}
                        </div>
                      </td>

                      {/* Test & Department */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 max-w-xs truncate">
                          {item.testName}
                        </div>
                        <div className="text-[11px] text-slate-500">{item.department}</div>
                      </td>

                      {/* Specimen / Sample */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-slate-700">{item.sampleId}</div>
                        <div className="text-[11px] text-slate-500">{item.tubeType || item.sampleType}</div>
                      </td>

                      {/* Analytical Findings */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700 font-medium">
                            {item.resultsCount} params
                          </span>
                          {item.criticalCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                              {item.criticalCount} Critical
                            </span>
                          )}
                          {item.abnormalCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                              {item.abnormalCount} Abnormal
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                          {item.summary}
                        </div>
                      </td>

                      {/* Submitted By */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-800">{item.submittedBy}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(item.submittedForReviewAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        {activeTab === "verified" ? (
                          <Link
                            href={`/pathologist/verified/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold transition-all"
                          >
                            <span>Inspect Certificate</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/pathologist/reports/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00355f] text-white hover:bg-[#002444] text-xs font-semibold shadow-sm transition-all"
                          >
                            <span>Review &amp; Certify</span>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
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

      {/* ================= CLINICAL DIRECTIVE CALLOUT ================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#002444] to-[#00355f] text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#94f2ef] text-xs font-bold uppercase tracking-wider">
            <VerifiedIcon className="w-4 h-4" />
            <span>Pathology Verification Standard</span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            All diagnostic interpretations signed here are immediately released to attending physicians and synchronized with patient records. Technicians are prohibited from final certifications. Ensure all abnormal flags are clinically correlated before signing.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-xs text-slate-300 font-mono bg-white/10 px-3 py-2 rounded-xl">
          <span>Digital Signer:</span>
          <span className="text-white font-semibold">{pathologist.name}</span>
        </div>
      </div>
    </div>
  );
}
