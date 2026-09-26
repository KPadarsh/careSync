"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconRequests,
  IconFlask,
  IconAlertTriangle,
  IconClock,
  IconChevronRight,
  IconRefresh,
  IconTestTube,
} from "./LabIcons";

interface LabRequestItem {
  id: string;
  reportNumber: string;
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
    phone?: string;
  };
  testType: string;
  testCategory: string;
  doctor: {
    id: string;
    name: string;
    department?: string;
  };
  priority: "stat" | "urgent" | "routine";
  status: string;
  requestedDate: string;
  sampleCode?: string;
  clinicalReason?: string;
}

export function RequestsView() {
  const [requests, setRequests] = useState<LabRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/lab/requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load lab requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRequests();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "stat":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            STAT Priority
          </span>
        );
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Urgent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Routine
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            Requested
          </span>
        );
      case "sample-pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Sample Pending
          </span>
        );
      case "sample-collected":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
            Sample Collected
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Processing
          </span>
        );
      case "result-entered":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            Result Entered
          </span>
        );
      case "submitted-for-review":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Awaiting Pathologist
          </span>
        );
      case "verified":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            Verified
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lab Requests</h1>
          <p className="text-sm text-slate-500 mt-1">
            Doctor-ordered laboratory investigations awaiting collection, sample registration, and analyzer processing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadRequests()}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <IconRefresh className="w-4 h-4 text-slate-500" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <IconSearch className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient, test name, ID, or doctor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-transparent transition-all"
            />
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
            {[
              { id: "all", label: "All" },
              { id: "requested", label: "Requested" },
              { id: "sample-pending", label: "Sample Pending" },
              { id: "sample-collected", label: "Sample Collected" },
              { id: "processing", label: "Processing" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === tab.id
                    ? "bg-[#004ac6] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <span className="text-xs font-medium text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004ac6]"
            >
              <option value="all">All Priorities</option>
              <option value="stat">STAT Only</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Requested Test</th>
                <th className="py-3.5 px-4">Ordering Doctor</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Requested Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                      Loading lab requests...
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <IconFlask className="w-6 h-6" />
                      </div>
                      <p className="font-medium text-slate-700">No laboratory requests found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        No requests match your current filters. Clear filters or wait for new doctor orders to arrive.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-slate-900">{req.patient?.name || "Unknown"}</div>
                        <div className="text-xs text-slate-500">
                          {req.patient?.age}y • {req.patient?.gender} • ID: {req.patient?.id?.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </td>

                    {/* Test */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                          <IconFlask className="w-4 h-4 text-[#004ac6]" />
                          {req.testType}
                        </div>
                        <div className="text-xs text-slate-500">
                          {req.testCategory || "General Pathology"}
                          {req.sampleCode && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[11px]">
                              {req.sampleCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-medium text-slate-800">{req.doctor?.name || "Dr. Staff"}</div>
                        <div className="text-xs text-slate-500">{req.doctor?.department || "General Medicine"}</div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">{getPriorityBadge(req.priority)}</td>

                    {/* Requested Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {req.requestedDate ? new Date(req.requestedDate).toLocaleDateString() : "Today"}
                      <div className="text-[11px] text-slate-400">
                        {req.requestedDate ? new Date(req.requestedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/lab/requests/${req.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#004ac6] hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                      >
                        {req.status === "requested" || req.status === "sample-pending"
                          ? "Collect Sample"
                          : req.status === "sample-collected"
                          ? "Start Processing"
                          : "View Details"}
                        <IconChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{requests.length}</span> active requests
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> STAT Orders prioritized
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Auto-sync enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
