"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SamplesIcon,
  BarcodeIcon,
  SearchIcon,
  RefreshIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  PrinterIcon,
} from "./LabIcons";

export const SamplesView: React.FC = () => {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState("");

  const fetchSamples = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/lab/samples?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load laboratory samples");
      }
      const data = await res.json();
      setSamples(data.samples || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load samples");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSamples();
  };

  const handleBarcodeLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedBarcode.trim()) return;
    setSearch(scannedBarcode.trim());
    fetchSamples();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "collected":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold">
            Collected
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold">
            Processing
          </span>
        );
      case "analyzed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-semibold">
            Analyzed
          </span>
        );
      case "stored":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
            Cold Stored
          </span>
        );
      case "disposed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
            Disposed
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

  const getTubeColorIndicator = (tubeType: string = "") => {
    const lower = tubeType.toLowerCase();
    if (lower.includes("lavender") || lower.includes("edta")) {
      return "border-l-4 border-l-purple-500";
    }
    if (lower.includes("gold") || lower.includes("sst")) {
      return "border-l-4 border-l-amber-500";
    }
    if (lower.includes("blue") || lower.includes("citrate")) {
      return "border-l-4 border-l-sky-500";
    }
    if (lower.includes("red")) {
      return "border-l-4 border-l-rose-500";
    }
    if (lower.includes("gray")) {
      return "border-l-4 border-l-slate-400";
    }
    return "border-l-4 border-l-teal-500";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">
              Specimen &amp; Sample Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold">
              {samples.length} Samples Accessioned
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tracking LabSample specimens, standardized SMP-2026 identifiers, and secure non-PII barcodes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchSamples}
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

      {/* QUICK BARCODE SCANNER BANNER */}
      <div className="bg-gradient-to-r from-[#00355f] to-[#0f4c81] rounded-xl p-4 text-white shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <BarcodeIcon size={22} className="text-[#86f2e4]" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Rapid Barcode Scanner Wedge</h2>
            <p className="text-xs text-[#d2e4ff]">
              Scan barcode label or enter token (e.g. SMP-2026-00125) for immediate accession lookup
            </p>
          </div>
        </div>

        <form onSubmit={handleBarcodeLookup} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Scan / Type barcode token..."
            value={scannedBarcode}
            onChange={(e) => setScannedBarcode(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#86f2e4] w-56 font-mono font-medium"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#006a68] hover:bg-[#00504e] text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
          >
            Scan &amp; Find
          </button>
        </form>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Specimens" },
              { id: "collected", label: "Collected" },
              { id: "processing", label: "Processing" },
              { id: "analyzed", label: "Analyzed" },
              { id: "stored", label: "Stored (Cold)" },
              { id: "disposed", label: "Disposed" },
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

          {/* Specimen Type filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
            >
              <option value="all">All Specimen Types</option>
              <option value="blood">Venous / Whole Blood</option>
              <option value="serum">Serum</option>
              <option value="plasma">Plasma</option>
              <option value="urine">Urine</option>
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
            placeholder="Search by Sample ID (e.g. SMP-2026-00125), Barcode, Storage Location, Patient, or Test..."
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

      {/* SAMPLES TABLE */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">{error}</div>
        ) : samples.length === 0 ? (
          <div className="text-center py-16 px-4">
            <SamplesIcon size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No samples found</p>
            <p className="text-xs text-slate-400 mt-1">
              Accession a specimen from a doctor lab request to generate a sample ID and barcode.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Sample Identifier</th>
                  <th className="py-3.5 px-4">Specimen &amp; Tube</th>
                  <th className="py-3.5 px-4">Barcode Label</th>
                  <th className="py-3.5 px-4">Test &amp; Patient</th>
                  <th className="py-3.5 px-4">Storage Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {samples.map((s) => (
                  <tr
                    key={s._id}
                    className={`hover:bg-slate-50/80 transition-colors group ${getTubeColorIndicator(s.tubeType)}`}
                  >
                    {/* Sample Identifier */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-xs text-[#00355f] group-hover:underline">
                          {s.sampleId}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Vol: {s.volume || "4.0 mL"}
                        </span>
                      </div>
                    </td>

                    {/* Specimen & Tube */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-slate-800">
                          {s.specimenType}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {s.tubeType}
                        </span>
                      </div>
                    </td>

                    {/* Barcode Label (Non-PII) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-white p-1 rounded border border-slate-200 shadow-2xs">
                          {/* Mini SVG Barcode simulation */}
                          <svg width="64" height="18" viewBox="0 0 64 18" className="text-slate-800">
                            <line x1="2" y1="0" x2="2" y2="18" stroke="currentColor" strokeWidth="2" />
                            <line x1="6" y1="0" x2="6" y2="18" stroke="currentColor" strokeWidth="1" />
                            <line x1="10" y1="0" x2="10" y2="18" stroke="currentColor" strokeWidth="3" />
                            <line x1="16" y1="0" x2="16" y2="18" stroke="currentColor" strokeWidth="1" />
                            <line x1="20" y1="0" x2="20" y2="18" stroke="currentColor" strokeWidth="2" />
                            <line x1="24" y1="0" x2="24" y2="18" stroke="currentColor" strokeWidth="1" />
                            <line x1="28" y1="0" x2="28" y2="18" stroke="currentColor" strokeWidth="3" />
                            <line x1="34" y1="0" x2="34" y2="18" stroke="currentColor" strokeWidth="1" />
                            <line x1="38" y1="0" x2="38" y2="18" stroke="currentColor" strokeWidth="2" />
                            <line x1="42" y1="0" x2="42" y2="18" stroke="currentColor" strokeWidth="1" />
                            <line x1="46" y1="0" x2="46" y2="18" stroke="currentColor" strokeWidth="3" />
                            <line x1="52" y1="0" x2="52" y2="18" stroke="currentColor" strokeWidth="1" />
                            <line x1="56" y1="0" x2="56" y2="18" stroke="currentColor" strokeWidth="2" />
                            <line x1="60" y1="0" x2="60" y2="18" stroke="currentColor" strokeWidth="1" />
                          </svg>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">
                          {s.barcodeToken}
                        </span>
                      </div>
                    </td>

                    {/* Test & Patient */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-xs text-slate-900">
                          {s.testName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {s.patient.name} ({s.patient.mrn})
                        </span>
                      </div>
                    </td>

                    {/* Storage Location */}
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      <span className="font-mono font-semibold">
                        {s.storageLocation}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {getStatusBadge(s.status)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/lab/samples/${s._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#00355f] text-slate-700 hover:text-white text-xs font-semibold transition-colors"
                      >
                        <span>Inspect</span>
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
