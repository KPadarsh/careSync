"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconTests,
  IconFlask,
  IconTestTube,
  IconRefresh,
  IconChevronRight,
  IconCheckCircle,
} from "./LabIcons";

interface TestQueueItem {
  id: string;
  reportNumber: string;
  testType: string;
  testCategory: string;
  sampleCode?: string;
  sampleId?: string;
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
  };
  doctor: {
    name: string;
  };
  priority: "stat" | "urgent" | "routine";
  status: string;
  requestedDate: string;
  parametersCount?: number;
}

export function TestsQueueView() {
  const [tests, setTests] = useState<TestQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadTests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/lab/tests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTests(data.tests || []);
      }
    } catch (err) {
      console.error("Failed to load test queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTests();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTests();
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
      case "sample-collected":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
            Sample Ready
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            In Analyzer
          </span>
        );
      case "result-entered":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            Result Drafted
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Test Worklist</h1>
          <p className="text-sm text-slate-500 mt-1">
            Tests undergoing analyzer calibration, parameter recording, and technical review before submission.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadTests()}
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
              placeholder="Search by test, sample code, patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-transparent transition-all"
            />
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
            {[
              { id: "all", label: "All Active" },
              { id: "sample-collected", label: "Sample Ready" },
              { id: "processing", label: "Processing" },
              { id: "result-entered", label: "Result Drafted" },
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
        </div>
      </div>

      {/* Test Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Test & Order #</th>
                <th className="py-3.5 px-4">Specimen Identifier</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Worklist Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                      Loading active tests...
                    </div>
                  </td>
                </tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <IconFlask className="w-6 h-6" />
                      </div>
                      <p className="font-medium text-slate-700">No active tests in the queue</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        All collected specimens have been submitted or are awaiting collection from the Requests view.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Test & Report Number */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <IconFlask className="w-4 h-4 text-[#004ac6]" />
                          {test.testType}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span>{test.testCategory}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600">{test.reportNumber}</span>
                        </div>
                      </div>
                    </td>

                    {/* Specimen ID */}
                    <td className="py-3.5 px-4">
                      {test.sampleCode ? (
                        <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded inline-flex items-center gap-1">
                          <IconTestTube className="w-3 h-3 text-[#004ac6]" />
                          {test.sampleCode}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600">Pending Assignment</span>
                      )}
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-medium text-slate-900">{test.patient?.name || "Patient Record"}</div>
                        <div className="text-xs text-slate-500">
                          {test.patient?.age}y • {test.patient?.gender}
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">{getPriorityBadge(test.priority)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(test.status)}</td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/lab/tests/${test.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#004ac6] hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                      >
                        {test.status === "result-entered" ? "Review & Submit" : "Enter Results"}
                        <IconChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{tests.length}</span> tests in diagnostic flow
          </div>
          <div className="text-[11px] text-slate-500">
            Station A-4 Analyzer Sync: <span className="font-semibold text-emerald-600">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
