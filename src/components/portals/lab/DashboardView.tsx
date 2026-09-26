"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconRequests,
  IconSamples,
  IconTests,
  IconCompleted,
  IconClock,
  IconCalendar,
  IconBarcode,
  IconAlertTriangle,
  IconRefresh,
  IconChevronRight,
  IconArrowRight,
} from "./LabIcons";

interface DashboardStats {
  pendingRequests: number;
  samplesPending: number;
  testsProcessing: number;
  resultsToSubmit: number;
  completedWork: number;
}

interface RequestItem {
  _id: string;
  testName: string;
  department: string;
  priority: "routine" | "urgent" | "stat";
  status: string;
  sampleCode: string;
  barcode: string;
  createdAt: string;
  patient: {
    _id: string;
    name: string;
    mrn: string;
    age: number;
    gender: string;
    bloodGroup: string;
  };
  doctor: {
    name: string;
    specialty: string;
  };
}

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats>({
    pendingRequests: 0,
    samplesPending: 0,
    testsProcessing: 0,
    resultsToSubmit: 0,
    completedWork: 0,
  });

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [needsAttention, setNeedsAttention] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lab/dashboard");
      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.requests) setRequests(data.requests);
        if (data.needsAttention) setNeedsAttention(data.needsAttention);
        if (data.recentActivity) setRecentActivity(data.recentActivity);
      }
    } catch (err) {
      console.error("Error loading lab dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
            Requested
          </span>
        );
      case "sample-pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Sample Pending
          </span>
        );
      case "sample-collected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            Sample Collected
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-fixed text-on-primary-fixed-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Processing
          </span>
        );
      case "result-entered":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary-container text-on-secondary-fixed">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            Result Entered
          </span>
        );
      case "submitted-for-review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-900">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            Submitted for Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container text-secondary">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
              Diagnostic Station A-4
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Dashboard</h1>
          <p className="text-xs text-secondary mt-0.5">
            Good morning! Here is your laboratory intake and analyzer schedule for today.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center bg-white border border-outline-variant/30 px-3 py-1.5 rounded-xl text-secondary text-xs shadow-sm">
            <IconCalendar className="w-4 h-4 text-primary mr-1.5" />
            <span>Today • {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <Link
            href="/lab/samples"
            className="inline-flex items-center gap-1.5 bg-primary text-white hover:bg-primary-container px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <IconBarcode className="w-4 h-4" />
            <span>Scan Tube</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Bento Grid (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Requests */}
        <Link
          href="/lab/requests"
          className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-primary/50 group"
        >
          <div className="flex flex-col">
            <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
              Pending Requests
            </span>
            <span className="text-2xl font-bold text-on-surface mt-1 group-hover:text-primary transition-colors">
              {stats.pendingRequests}
            </span>
            <span className="text-[11px] text-secondary mt-0.5">Awaiting batch intake</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
            <IconRequests className="w-5 h-5" />
          </div>
        </Link>

        {/* Samples Pending */}
        <Link
          href="/lab/samples"
          className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-tertiary/50 group"
        >
          <div className="flex flex-col">
            <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
              Samples Pending
            </span>
            <span className="text-2xl font-bold text-on-surface mt-1 group-hover:text-tertiary transition-colors">
              {stats.samplesPending}
            </span>
            <span className="text-[11px] text-secondary mt-0.5">In phlebotomy room</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-tertiary">
            <IconSamples className="w-5 h-5" />
          </div>
        </Link>

        {/* Tests Processing */}
        <Link
          href="/lab/tests"
          className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-primary-container/50 group"
        >
          <div className="flex flex-col">
            <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
              Tests Processing
            </span>
            <span className="text-2xl font-bold text-on-surface mt-1 group-hover:text-primary-container transition-colors">
              {stats.testsProcessing}
            </span>
            <span className="text-[11px] text-secondary mt-0.5">Active analyzer runs</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-surface-container-low flex items-center justify-center text-primary-container">
            <IconTests className="w-5 h-5" />
          </div>
        </Link>

        {/* Results to Submit */}
        <Link
          href="/lab/tests?filter=ready"
          className="bg-white rounded-xl p-4 border border-outline-variant/30 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-secondary/50 group"
        >
          <div className="flex flex-col">
            <span className="text-[11px] text-secondary uppercase tracking-wider font-semibold">
              Results to Submit
            </span>
            <span className="text-2xl font-bold text-on-surface mt-1 group-hover:text-secondary transition-colors">
              {stats.resultsToSubmit}
            </span>
            <span className="text-[11px] text-secondary mt-0.5">Ready for pathologist</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-fixed">
            <IconCompleted className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* Main Grid: Worklist Table (8 Cols) + Needs Attention & Timeline (4 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Lab Requests Table */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-xl border border-outline-variant/30 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-on-surface tracking-tight">Today&apos;s Lab Requests</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
                {requests.length} Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-secondary">Auto-sync:</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-semibold text-primary">Active</span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-secondary">
                <IconRefresh className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
                Loading lab requests worklist...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-16 text-center text-xs text-secondary">
                <IconRequests className="w-8 h-8 mx-auto text-outline mb-2" />
                No active lab requests today.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-secondary uppercase text-[11px] font-semibold border-b border-outline-variant/20">
                    <th className="py-3 pl-5 pr-3">Patient</th>
                    <th className="py-3 px-3">Test</th>
                    <th className="py-3 px-3">Requested By</th>
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 pl-3 pr-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {requests.map((item) => (
                    <tr key={item._id} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-3 pl-5 pr-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-on-surface">{item.patient.name}</span>
                          <span className="text-[11px] text-secondary font-mono">
                            #{item.patient.mrn} • {item.patient.age}y {item.patient.gender}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {item.priority === "stat" && (
                            <span className="px-1 py-0.2 bg-error-container text-error text-[10px] font-bold rounded">
                              STAT
                            </span>
                          )}
                          <span className="font-medium text-on-surface">{item.testName}</span>
                        </div>
                        <span className="text-[11px] text-secondary font-mono">{item.sampleCode}</span>
                      </td>

                      <td className="py-3 px-3 text-secondary">
                        <span className="font-medium text-on-surface">{item.doctor.name}</span>
                        <p className="text-[10px] text-secondary">{item.doctor.specialty}</p>
                      </td>

                      <td className="py-3 px-3 text-secondary whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                        {item.status === "result-entered" || item.status === "processing" ? (
                          <Link
                            href={`/lab/tests/${item._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary text-white hover:bg-primary-container text-xs font-semibold rounded-lg shadow-sm transition-colors"
                          >
                            <span>Enter Result</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/lab/requests/${item._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container text-primary hover:bg-primary hover:text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            <span>Open</span>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="px-5 py-3 bg-surface-container-low/40 border-t border-outline-variant/20 flex items-center justify-between text-xs text-secondary">
            <span>Showing {requests.length} daily prioritized lab items</span>
            <Link href="/lab/requests" className="text-primary hover:underline font-semibold flex items-center gap-1">
              <span>View All Worklist</span>
              <IconChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Needs Attention & Recent Activity */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Needs Attention Card */}
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <IconAlertTriangle className="w-5 h-5 text-error" />
                <h3 className="font-semibold text-sm text-on-surface">Needs Attention</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-error-container text-error">
                {needsAttention.length} Items
              </span>
            </div>

            <div className="space-y-3">
              {needsAttention.length === 0 ? (
                <p className="text-xs text-secondary py-4 text-center">No urgent attention items.</p>
              ) : (
                needsAttention.map((att, i) => (
                  <div key={i} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-error tracking-wider">
                        {att.priority.toUpperCase()} Flag
                      </span>
                      <span className="text-[10px] text-secondary font-mono">{att.time}</span>
                    </div>
                    <p className="text-xs font-bold text-on-surface">{att.title}</p>
                    <p className="text-[11px] text-secondary leading-snug">{att.detail}</p>
                    <div className="pt-1">
                      <Link
                        href={`/lab/tests/${att.id}`}
                        className="w-full inline-flex items-center justify-center gap-1 py-1.5 bg-primary text-white hover:bg-primary-container text-xs font-semibold rounded-lg shadow-sm transition-colors"
                      >
                        <span>Process Result</span>
                        <IconArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <IconClock className="w-5 h-5 text-secondary" />
                <h3 className="font-semibold text-sm text-on-surface">Recent Activity</h3>
              </div>
              <span className="text-xs text-secondary font-mono">Real-time</span>
            </div>

            <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-high">
              {recentActivity.map((act) => (
                <div key={act.id} className="relative">
                  <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-primary ring-4 ring-white"></span>
                  <div className="flex flex-col">
                    <p className="text-xs font-medium text-on-surface leading-tight">{act.title}</p>
                    <p className="text-[11px] text-secondary mt-0.5">{act.detail}</p>
                    <span className="text-[10px] text-secondary mt-1 font-mono">{act.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
