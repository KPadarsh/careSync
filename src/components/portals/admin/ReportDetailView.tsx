"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  ArrowLeftIcon,
  ReportsIcon,
  PrinterIcon,
  RefreshIcon,
  AlertTriangleIcon,
} from "./AdminShell";

interface ReportDetailViewProps {
  id: string;
}

export function ReportDetailView({ id }: ReportDetailViewProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reports/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Report not found");
      }
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  if (loading) {
    return (
      <AdminShell activeKey="reports">
        <div className="p-12 text-center text-slate-400">Compiling administrative dataset...</div>
      </AdminShell>
    );
  }

  if (error || !report) {
    return (
      <AdminShell activeKey="reports">
        <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
          <AlertTriangleIcon className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Report Not Available</h2>
          <p className="text-sm text-slate-500">{error || "Requested report ID could not be loaded."}</p>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Reports Catalog
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeKey="reports">
      <div className="space-y-6">
        {/* Back navigation & actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Reports Catalog
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              Re-run
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              Export / Print
            </button>
          </div>
        </div>

        {/* Report Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
              {report.category}
            </span>
            <span className="text-xs text-slate-400">
              Generated: {new Date(report.generatedAt).toLocaleString()}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{report.title}</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">{report.description}</p>
        </div>

        {/* Summary Stat Grid */}
        {report.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(report.summary).map(([k, v]) => {
              if (typeof v === "object" && v !== null) return null;
              return (
                <div key={k} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {k.replace(/([A-Z])/g, " $1")}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-1.5">{String(v)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Detailed Records ({report.data?.length || 0})</span>
            <span className="text-slate-400 font-normal">Administrative Infrastructure Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {report.columns?.map((col: any) => (
                    <th key={col.key} className="py-3 px-4">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.data?.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    {report.columns?.map((col: any) => (
                      <td key={col.key} className="py-3 px-4 text-xs text-slate-800">
                        {String(row[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
