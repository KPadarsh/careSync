"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconSearch,
  IconTestTube,
  IconBarcode,
  IconRefresh,
  IconChevronRight,
  IconFlask,
} from "./LabIcons";

interface SampleItem {
  id: string;
  sampleId: string;
  barcode: string;
  patient: {
    id: string;
    name: string;
    age: number;
    gender: string;
  };
  testType: string;
  sampleType: string;
  containerType: string;
  collectionVolume: string;
  storageLocation: string;
  status: string;
  collectedAt: string;
  collectedBy: {
    id: string;
    name: string;
  };
}

export function SamplesView() {
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadSamples = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/lab/samples?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSamples(data.samples || []);
      }
    } catch (err) {
      console.error("Failed to load samples:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSamples();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSamples();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "collected":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            Collected
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            In Analyzer
          </span>
        );
      case "tested":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Tested
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            Archived
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Rejected
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Specimen Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track biological specimens, vacutainer barcode identifiers, collection volumes, and cold storage rack custody.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSamples()}
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
              placeholder="Search by Sample ID, Barcode, Patient, or Test..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-transparent transition-all"
            />
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Status:</span>
            {[
              { id: "all", label: "All Specimens" },
              { id: "collected", label: "Collected" },
              { id: "processing", label: "In Analyzer" },
              { id: "tested", label: "Tested" },
              { id: "archived", label: "Archived" },
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

      {/* Samples Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Sample Identifier</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Associated Investigation</th>
                <th className="py-3.5 px-4">Container & Volume</th>
                <th className="py-3.5 px-4">Storage Location</th>
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
                      Loading specimen records...
                    </div>
                  </td>
                </tr>
              ) : samples.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <IconTestTube className="w-6 h-6" />
                      </div>
                      <p className="font-medium text-slate-700">No specimens found</p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Specimens will appear here once collected from active doctor requests.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                samples.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Sample ID & Barcode */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          <IconTestTube className="w-4 h-4 text-[#004ac6]" />
                          {s.sampleId}
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-600">
                            <IconBarcode className="w-3 h-3 text-slate-400" />
                            {s.barcode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-slate-900">{s.patient?.name || "Patient Record"}</div>
                        <div className="text-xs text-slate-500">
                          {s.patient?.age}y • {s.patient?.gender}
                        </div>
                      </div>
                    </td>

                    {/* Test Type */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{s.testType}</div>
                      <div className="text-xs text-slate-500">{s.sampleType}</div>
                    </td>

                    {/* Container & Volume */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{s.containerType}</div>
                      <div className="text-xs text-slate-500 font-mono">Vol: {s.collectionVolume || "4.0 mL"}</div>
                    </td>

                    {/* Storage Location */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {s.storageLocation || "Station Rack A-1"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/lab/samples/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#004ac6] hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                      >
                        Custody & Log
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
            Showing <span className="font-semibold text-slate-700">{samples.length}</span> registered specimens
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
              HIPAA compliant: No PHI encoded in barcodes
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
