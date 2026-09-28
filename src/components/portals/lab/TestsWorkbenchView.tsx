"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TestsIcon,
  SearchIcon,
  RefreshIcon,
  ChevronRightIcon,
  BeakerIcon,
  BarcodeIcon,
} from "./LabIcons";

export const TestsWorkbenchView: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [benchFilter, setBenchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchTests = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (benchFilter !== "all") params.append("bench", benchFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/lab/tests?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load test workbenches");
      }
      const data = await res.json();
      setTests(data.tests || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load tests");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [benchFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTests();
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "stat":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase tracking-wider animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            STAT
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

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">
              Analytical Testing Workbench
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
              {tests.length} Active Runs
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time analyzer benches: Clinical Chemistry, Automated Hematology, Immunoassay, and Coagulation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTests}
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
          {/* Department Benches */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Benches" },
              { id: "chemistry", label: "Clinical Chemistry" },
              { id: "hematology", label: "Hematology" },
              { id: "immunology", label: "Immunology" },
              { id: "endocrinology", label: "Endocrinology" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setBenchFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  benchFilter === tab.id
                    ? "bg-[#00355f] text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
            >
              <option value="all">All Active Stages</option>
              <option value="sample_collected">Sample Collected</option>
              <option value="processing">In Processing</option>
              <option value="result_entered">Result Entered</option>
            </select>
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
            placeholder="Search test name, sample identifier, or patient..."
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

      {/* TESTS GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-600 text-sm">{error}</div>
      ) : tests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center">
          <BeakerIcon size={36} className="text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No active tests at this bench</p>
          <p className="text-xs text-slate-400 mt-1">
            Check the Requisitions queue to collect specimens and dispatch to the analyzer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tests.map((t) => (
            <div
              key={t._id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col justify-between hover:border-[#0f4c81] transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-sm text-[#00355f] truncate">
                      {t.testName}
                    </span>
                    <span className="text-[11px] text-slate-500">{t.department}</span>
                  </div>
                  {getPriorityBadge(t.priority)}
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Sample ID
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {t.sampleId}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      Patient
                    </span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {t.patient.name}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400">Bench: </span>
                    <span className="font-medium text-purple-700">{t.analyzerBench}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Results Entered: </span>
                    <span className="font-semibold text-slate-800">
                      {t.resultsCount > 0 ? `${t.resultsCount} parameters entered` : "Awaiting entry"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize">
                  {t.status.replace("_", " ")}
                </span>

                <Link
                  href={`/lab/tests/${t._id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00355f] hover:bg-[#0f4c81] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <span>Enter Results</span>
                  <ChevronRightIcon size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
