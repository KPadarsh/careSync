"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RequestsIcon,
  SamplesIcon,
  TestsIcon,
  CompletedIcon,
  ClockIcon,
  AlertTriangleIcon,
  RefreshIcon,
  ChevronRightIcon,
  BarcodeIcon,
  BeakerIcon,
  ArrowRightIcon,
} from "./LabIcons";

interface DashboardData {
  metrics: {
    newRequests: number;
    samplesPending: number;
    processingTests: number;
    resultsAwaitingSubmission: number;
    completedWork: number;
  };
  recentRequests: any[];
  activeSamples: any[];
  pendingSubmissions: any[];
  technician: {
    name: string;
    email: string;
    station: string;
    role: string;
    shift: string;
  };
}

export const DashboardView: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/lab/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load laboratory dashboard data");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "stat":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            STAT
          </span>
        );
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
            Urgent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold uppercase tracking-wider">
            Routine
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "requested":
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium">
            Requested
          </span>
        );
      case "sample_pending":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
            Sample Pending
          </span>
        );
      case "sample_collected":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium">
            Sample Collected
          </span>
        );
      case "processing":
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium">
            Processing
          </span>
        );
      case "result_entered":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-[11px] font-medium">
            Result Entered
          </span>
        );
      case "submitted_for_review":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
            Submitted for Review
          </span>
        );
      case "verified":
      case "finalized":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-[11px] font-medium">
            Pathology Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">
            Initializing CareSync Lab Workstation...
          </span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangleIcon size={24} className="text-rose-600" />
          <span>{error || "Failed to load dashboard data."}</span>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { metrics, recentRequests, activeSamples, pendingSubmissions, technician } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">
              Lab Technician Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              Live Analytical Session
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <strong className="font-semibold text-slate-700">{technician.name}</strong> •{" "}
            {technician.station} • {technician.shift}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDashboard}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all"
          >
            <RefreshIcon
              size={14}
              className={refreshing ? "animate-spin text-teal-600" : "text-slate-500"}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh Queue"}</span>
          </button>

          <Link
            href="/lab/requests"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00355f] text-white hover:bg-[#0f4c81] text-xs font-semibold shadow-xs transition-all"
          >
            <span>View All Requisitions</span>
            <ChevronRightIcon size={14} />
          </Link>
        </div>
      </div>

      {/* 5 PRIMARY DASHBOARD TILES (Required by Prompt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Tile 1: New Requests */}
        <Link
          href="/lab/requests?status=requested"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:border-[#0f4c81] hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              New Requests
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <RequestsIcon size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#00355f]">
                {metrics.newRequests}
              </span>
              <span className="text-xs text-slate-500">doctor orders</span>
            </div>
            <span className="text-[11px] text-blue-600 mt-1 block font-medium">
              Awaiting intake
            </span>
          </div>
        </Link>

        {/* Tile 2: Samples Pending */}
        <Link
          href="/lab/requests?status=sample_pending"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:border-[#0f4c81] hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Samples Pending
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ClockIcon size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-amber-700">
                {metrics.samplesPending}
              </span>
              <span className="text-xs text-slate-500">specimens</span>
            </div>
            <span className="text-[11px] text-amber-600 mt-1 block font-medium">
              Need collection
            </span>
          </div>
        </Link>

        {/* Tile 3: Processing Tests */}
        <Link
          href="/lab/tests"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:border-[#0f4c81] hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Processing Tests
            </span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <TestsIcon size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-purple-700">
                {metrics.processingTests}
              </span>
              <span className="text-xs text-slate-500">at benches</span>
            </div>
            <span className="text-[11px] text-purple-600 mt-1 block font-medium">
              On analyzers
            </span>
          </div>
        </Link>

        {/* Tile 4: Results Awaiting Submission */}
        <Link
          href="/lab/requests?status=result_entered"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:border-[#0f4c81] hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Awaiting Submission
            </span>
            <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <BeakerIcon size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-cyan-700">
                {metrics.resultsAwaitingSubmission}
              </span>
              <span className="text-xs text-slate-500">entered</span>
            </div>
            <span className="text-[11px] text-cyan-600 mt-1 block font-medium">
              Ready for review
            </span>
          </div>
        </Link>

        {/* Tile 5: Completed Work */}
        <Link
          href="/lab/completed"
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-xs hover:border-[#0f4c81] hover:shadow-sm transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Completed Work
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#006a68] flex items-center justify-center">
              <CompletedIcon size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-[#006a68]">
                {metrics.completedWork}
              </span>
              <span className="text-xs text-slate-500">verified</span>
            </div>
            <span className="text-[11px] text-[#006a68] mt-1 block font-medium">
              Archived / Released
            </span>
          </div>
        </Link>
      </div>

      {/* QUICK WORKSTATION ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/lab/requests"
          className="p-4 rounded-xl bg-gradient-to-r from-[#00355f] to-[#0f4c81] text-white flex items-center justify-between shadow-xs hover:opacity-95 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <RequestsIcon size={20} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Collect Sample from Request</h2>
              <p className="text-xs text-[#a0c9ff]">Assign tube &amp; generate barcode token</p>
            </div>
          </div>
          <ArrowRightIcon size={16} className="text-white/70 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/lab/samples"
          className="p-4 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#006a68] flex items-center justify-center">
              <BarcodeIcon size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#00355f]">Sample Specimen Scanner</h2>
              <p className="text-xs text-slate-500">Lookup SMP-2026 or barcode label</p>
            </div>
          </div>
          <ArrowRightIcon size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/lab/tests"
          className="p-4 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between shadow-xs hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <TestsIcon size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[#00355f]">Open Analytical Workbench</h2>
              <p className="text-xs text-slate-500">Enter parameters &amp; submit for review</p>
            </div>
          </div>
          <ArrowRightIcon size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* TWO COLUMN WORKSTATION GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: RECENT DOCTOR REQUESTS TABLE */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-base text-[#00355f]">Doctor Lab Requisitions</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                {recentRequests.length} active
              </span>
            </div>
            <Link
              href="/lab/requests"
              className="text-xs font-semibold text-[#006a68] hover:underline flex items-center gap-1"
            >
              <span>View full list</span>
              <ChevronRightIcon size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Requested Test</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No active lab requisitions found.
                    </td>
                  </tr>
                ) : (
                  recentRequests.map((r) => (
                    <tr
                      key={r._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-xs group-hover:text-[#00355f]">
                            {r.patient.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {r.patient.mrn} • {r.patient.age}y • {r.patient.gender[0]?.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 text-xs">
                            {r.testName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {r.department}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {r.doctor.name}
                      </td>
                      <td className="py-3 px-4">
                        {getPriorityBadge(r.priority)}
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/lab/requests/${r._id}`}
                          className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 hover:bg-[#00355f] text-slate-700 hover:text-white text-xs font-semibold transition-colors"
                        >
                          Process
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: BENCH CARDS & AWAITING SUBMISSION */}
        <div className="flex flex-col gap-6">
          {/* Active Specimen Accessioning Bench */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SamplesIcon size={18} className="text-[#006a68]" />
                <h2 className="font-bold text-sm text-[#00355f]">Accessioning Queue</h2>
              </div>
              <Link href="/lab/samples" className="text-[11px] font-semibold text-teal-700 hover:underline">
                View Samples
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-slate-100 mt-2">
              {activeSamples.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No active samples at the accessioning bench.
                </p>
              ) : (
                activeSamples.slice(0, 4).map((s) => (
                  <Link
                    key={s._id}
                    href={`/lab/samples/${s._id}`}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-1 rounded transition-colors"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#00355f] font-mono">
                          {s.sampleId}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-medium border border-teal-200">
                          {s.specimenType}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 truncate mt-0.5">
                        {s.testName}
                      </span>
                    </div>
                    <ChevronRightIcon size={14} className="text-slate-400 flex-shrink-0" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Results Awaiting Submission to Pathologist */}
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BeakerIcon size={18} className="text-cyan-700" />
                <h2 className="font-bold text-sm text-[#00355f]">Awaiting Submission</h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 text-[10px] font-bold">
                {pendingSubmissions.length} Ready
              </span>
            </div>

            <div className="flex flex-col gap-2.5 mt-3">
              {pendingSubmissions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  All entered test results have been submitted to Pathology.
                </p>
              ) : (
                pendingSubmissions.map((item) => (
                  <div
                    key={item._id}
                    className="p-3 rounded-lg bg-cyan-50/50 border border-cyan-100 flex items-center justify-between"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-slate-800 truncate">
                        {item.testName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {item.patientName} • {item.resultsCount} parameters entered
                      </span>
                    </div>
                    <Link
                      href={`/lab/tests/${item._id}`}
                      className="px-2.5 py-1 rounded bg-[#00355f] text-white text-[11px] font-semibold hover:bg-[#0f4c81] transition-colors flex-shrink-0"
                    >
                      Submit
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
