"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  ReportsIcon,
  RefreshIcon,
  ChevronRightIcon,
  FileTextIcon,
  PrinterIcon,
} from "./AdminShell";

interface ReportMeta {
  id: string;
  title: string;
  category: string;
  description: string;
  totalRecords: number;
  lastGenerated: string;
}

export function ReportsView() {
  const [reports, setReports] = useState<ReportMeta[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports");
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <AdminShell activeKey="reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Administrative & Operational Reports
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Workforce distribution, medical staffing capacity, departmental assignments, and system compliance reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchReports}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <PrinterIcon className="w-3.5 h-3.5" />
              Print Index
            </button>
          </div>
        </div>

        {/* Reports Catalog Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            Compiling administrative report catalog...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {rep.category}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {rep.totalRecords} Entries
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    <Link href={`/admin/reports/${rep.id}`} className="hover:text-indigo-600">
                      {rep.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3">{rep.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Live Infrastructure View</span>
                  <Link
                    href={`/admin/reports/${rep.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Report
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
