"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconCompleted,
  IconFlask,
  IconTestTube,
  IconRefresh,
  IconChevronRight,
  IconCheckCircle,
} from "./LabIcons";

interface CompletedItem {
  id: string;
  reportNumber: string;
  testType: string;
  testCategory: string;
  sampleCode?: string;
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
  };
  doctor: {
    name: string;
  };
  status: string;
  submittedAt: string;
  verifiedAt?: string;
  technicianNotes?: string;
}

export function CompletedTestsView() {
  const [completed, setCompleted] = useState<CompletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadCompleted = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/lab/completed?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCompleted(data.completed || []);
      }
    } catch (err) {
      console.error("Failed to load completed tests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompleted();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCompleted();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted-for-review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
            Pathologist Review
          </span>
        );
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Verified & Signed
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Completed Work Archive</h1>
          <p className="text-sm text-slate-500 mt-1">
            Historical laboratory results submitted for review, verified by pathologists, and released to physicians.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadCompleted()}
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
              placeholder="Search by test, report number, or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-transparent transition-all"
            />
          </form>
        </div>
      </div>

      {/* Completed Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Report Number</th>
                <th className="py-3.5 px-4">Investigation & Category</th>
                <th className="py-3.5 px-4">Specimen Code</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4">Current Review Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
                      Loading completed records...
                    </div>
                  </td>
                </tr>
              ) : completed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <IconCompleted className="w-6 h-6" />
                      </div>
                      <p className="font-medium text-slate-700">No completed reports found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Reports submitted for review and verified results will be archived here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                completed.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Report Number */}
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        {item.reportNumber}
                      </span>
                    </td>

                    {/* Investigation */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <IconFlask className="w-4 h-4 text-[#004ac6]" />
                          {item.testType}
                        </div>
                        <div className="text-xs text-slate-500">{item.testCategory}</div>
                      </div>
                    </td>

                    {/* Sample */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-slate-700 flex items-center gap-1">
                        <IconTestTube className="w-3.5 h-3.5 text-teal-600" />
                        {item.sampleCode || "—"}
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-medium text-slate-900">{item.patient?.name || "Patient Record"}</div>
                        <div className="text-xs text-slate-500">
                          {item.patient?.age}y • {item.patient?.gender}
                        </div>
                      </div>
                    </td>

                    {/* Submitted Date */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : "Recently"}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(item.status)}</td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/lab/tests/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#004ac6] hover:underline"
                      >
                        View File
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
            Showing <span className="font-semibold text-slate-700">{completed.length}</span> completed investigations
          </div>
          <div>All records tamper-proof logged</div>
        </div>
      </div>
    </div>
  );
}
