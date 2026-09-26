"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface LabResultItem {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "normal" | "high" | "low" | "critical";
}

interface LabReportDoc {
  _id: string;
  testName: string;
  department: string;
  sampleCollectionDate: string;
  verifiedDate?: string;
  status: "verified" | "finalized" | "pending";
  summary: string;
  verifiedBy?: string;
  results: LabResultItem[];
  doctorId?: {
    name: string;
    specialty: string;
  };
}

export function LabReportsView() {
  const [reports, setReports] = useState<LabReportDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<LabReportDoc | null>(null);

  useEffect(() => {
    fetch("/api/patient/lab-reports")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.reports) {
          setReports(data.reports);
        }
      })
      .catch((err) => console.error("Error loading lab reports:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter((item) => {
    if (filter === "all") return true;
    return item.department.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Laboratory &amp; Diagnostic Reports</h2>
          <p className="text-sm text-[#45464d] mt-1">
            Verified pathology tests, biochemical panels, and clinical specimen evaluations.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#e2e8f0] pb-3">
        {[
          { id: "all", label: "All Verified Reports" },
          { id: "Biochemistry", label: "Biochemistry" },
          { id: "Hematology", label: "Hematology" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === tab.id
                ? "bg-[#131b2e] text-white"
                : "bg-[#eff4ff] text-[#45464d] hover:text-[#0b1c30]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-[#e2e8f0] animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-16 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#006a61] mx-auto flex items-center justify-center mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-[#0b1c30]">No lab reports found</p>
          <p className="text-xs text-[#45464d] mt-1">There are no reports available in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <Card
              key={item._id}
              className="p-6 border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 hover:border-[#131b2e]/30 transition-all"
            >
              <div className="space-y-2.5 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#22c55e]/10 text-[#22c55e]">
                    Verified
                  </span>
                  <span className="text-[#45464d]">
                    Collection: {new Date(item.sampleCollectionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#006a61] font-semibold">{item.department}</span>
                </div>

                <h4 className="text-base font-bold text-[#0b1c30]">{item.testName}</h4>
                <p className="text-xs text-[#45464d]">
                  Ordering Physician: <strong className="text-[#0b1c30]">{item.doctorId?.name || "Attending Physician"}</strong> • Verified By: <span className="font-medium text-[#0b1c30]">{item.verifiedBy || "Pathologist on Duty"}</span>
                </p>

                <p className="text-xs text-[#0b1c30] bg-[#eff4ff]/60 border border-[#dce9ff] p-3 rounded-lg leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReport(item)}
                  className="px-4 py-2 bg-[#131b2e] text-white rounded-lg text-xs font-semibold hover:bg-[#213145] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Test Values
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Lab Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0b1c30]">{selectedReport.testName}</h3>
                <p className="text-xs text-[#45464d]">
                  {selectedReport.department} • Verified {new Date(selectedReport.sampleCollectionDate).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="text-[#45464d] hover:text-[#0b1c30] p-1 rounded"
              >
                ✕
              </button>
            </div>

            {/* Pathologist Summary */}
            <div className="p-3.5 bg-[#eff4ff] rounded-xl border border-[#dce9ff] text-xs">
              <p className="font-bold text-[#006a61] uppercase tracking-wider mb-1">Clinical Evaluation</p>
              <p className="text-[#0b1c30] leading-relaxed">{selectedReport.summary}</p>
              <p className="text-[11px] text-[#45464d] mt-2">
                Certified by: <strong>{selectedReport.verifiedBy}</strong>
              </p>
            </div>

            {/* Test Results Table */}
            <div className="overflow-x-auto border border-[#e2e8f0] rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#eff4ff]/60 border-b border-[#e2e8f0] text-[#45464d] font-semibold">
                    <th className="py-2.5 px-3">Analyte / Parameter</th>
                    <th className="py-2.5 px-3">Observed Value</th>
                    <th className="py-2.5 px-3">Reference Range</th>
                    <th className="py-2.5 px-3 text-right">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {selectedReport.results.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium text-[#0b1c30]">{r.parameter}</td>
                      <td className="py-2.5 px-3 font-bold text-[#0b1c30]">
                        {r.value} <span className="text-[10px] text-[#45464d] font-normal">{r.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#45464d]">{r.referenceRange}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            r.flag === "normal"
                              ? "bg-[#22c55e]/10 text-[#22c55e]"
                              : "bg-[#f59e0b]/10 text-[#f59e0b]"
                          }`}
                        >
                          {r.flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
              >
                Print Diagnostic Report
              </button>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-5 py-2 bg-[#131b2e] text-white rounded-lg text-xs font-semibold hover:bg-[#213145] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
