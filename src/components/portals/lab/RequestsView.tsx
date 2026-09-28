"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  RequestsIcon,
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
} from "./LabIcons";

export const RequestsView: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchRequests = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (priorityFilter !== "all") params.append("priority", priorityFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/lab/requests?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load doctor lab requests");
      }
      const data = await res.json();
      setRequests(data.requests || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "stat":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            STAT Order
          </span>
        );
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
            Urgent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold uppercase tracking-wider">
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            Requested
          </span>
        );
      case "sample_pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
            Sample Pending
          </span>
        );
      case "sample_collected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
            Sample Collected
          </span>
        );
      case "processing":
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
            Processing
          </span>
        );
      case "result_entered":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-semibold">
            Result Entered
          </span>
        );
      case "submitted_for_review":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            Submitted for Review
          </span>
        );
      case "verified":
      case "finalized":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-semibold">
            Verified / Finalized
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            {status}
          </span>
        );
    }
  };

  const getActionLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "requested":
      case "pending":
      case "sample_pending":
        return "Collect Sample";
      case "sample_collected":
        return "Start Process";
      case "processing":
      case "in-progress":
        return "Enter Results";
      case "result_entered":
        return "Review & Submit";
      default:
        return "View Details";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">
              Doctor-Created Lab Requests
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
              {requests.length} Orders
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real clinical test requisitions authored by attending doctors during consultations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchRequests}
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Requests" },
              { id: "requested", label: "Requested" },
              { id: "sample_pending", label: "Sample Pending" },
              { id: "sample_collected", label: "Sample Collected" },
              { id: "processing", label: "Processing" },
              { id: "result_entered", label: "Result Entered" },
              { id: "submitted_for_review", label: "Submitted" },
              { id: "completed", label: "Verified" },
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

          {/* Priority Quick Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
            >
              <option value="all">All Priorities</option>
              <option value="stat">STAT Only</option>
              <option value="urgent">Urgent</option>
              <option value="routine">Routine</option>
            </select>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by patient name, MRN, doctor, or test name..."
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

      {/* REQUESTS DATA TABLE (Exact Stitch requirements) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">{error}</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 px-4">
            <RequestsIcon size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No lab requests found</p>
            <p className="text-xs text-slate-400 mt-1">
              Adjust your filters or search keywords to view other requisitions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Requested Tests</th>
                  <th className="py-3.5 px-4">Doctor</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Requested Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((r) => (
                  <tr
                    key={r._id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0f4c81]/10 text-[#00355f] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {r.patient.bloodGroup}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 text-xs group-hover:text-[#00355f]">
                            {r.patient.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {r.patient.mrn} • {r.patient.age}y • {r.patient.gender}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Requested Tests */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 text-xs">
                          {r.testName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {r.department}
                        </span>
                        {r.sampleId && (
                          <span className="text-[10px] text-teal-700 font-mono mt-0.5">
                            ID: {r.sampleId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Doctor */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 text-xs">
                          {r.doctor.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {r.doctor.specialty}
                        </span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      {getPriorityBadge(r.priority)}
                    </td>

                    {/* Requested Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {new Date(r.requestedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      <span className="block text-[10px] text-slate-400">
                        {new Date(r.requestedDate).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(r.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/lab/requests/${r._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00355f] text-white hover:bg-[#0f4c81] text-xs font-semibold shadow-2xs transition-all"
                      >
                        <span>{getActionLabel(r.status)}</span>
                        <ChevronRightIcon size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
