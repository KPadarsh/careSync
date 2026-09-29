"use client";

import React, { useState, useEffect } from "react";
import {
  AdminShell,
  AuditLogsIcon,
  SearchIcon,
  RefreshIcon,
  PrinterIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ShieldIcon,
  ClockIcon,
} from "./AdminShell";

interface AuditLogItem {
  _id: string;
  actor: {
    name: string;
    email: string;
    role: string;
  };
  action: string;
  resource: string;
  resourceType: string;
  ipAddress?: string;
  status: "success" | "warning" | "failure";
  metadata?: Record<string, any>;
  createdAt: string;
}

export function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (typeFilter !== "all") params.append("resourceType", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [typeFilter, statusFilter]);

  return (
    <AdminShell activeKey="audit-logs">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              System Audit & Compliance Logs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Read-only server-generated security audit ledger tracking administrative operations and privilege modifications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
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
              Export Audit Trail
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
              placeholder="Search by action, actor, resource..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Category:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
              >
                <option value="all">All Categories</option>
                <option value="staff">Staff</option>
                <option value="doctor">Doctor</option>
                <option value="department">Department</option>
                <option value="schedule">Schedule</option>
                <option value="user">User & Roles</option>
                <option value="settings">Settings</option>
                <option value="system">System</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
              >
                <option value="all">All Outcomes</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="failure">Failure</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <AuditLogsIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No audit records found</h3>
              <p className="text-sm text-slate-500 mt-1">Adjust your search or category filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Target Resource</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900">
                        {log.action}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800">{log.actor?.name}</div>
                        <div className="text-[10px] text-slate-400">{log.actor?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-slate-700">
                        {log.resource}
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {log.resourceType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                            log.status === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : log.status === "warning"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {log.status === "success" ? (
                            <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <AlertTriangleIcon className="w-3 h-3" />
                          )}
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Metadata Inspection Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Audit Record Inspector</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">Action:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedLog.action}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Actor:</span>
                    <span className="text-slate-800 font-medium">
                      {selectedLog.actor?.name} ({selectedLog.actor?.email})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Actor Role:</span>
                    <span className="text-slate-800 font-medium capitalize">{selectedLog.actor?.role}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-semibold uppercase text-[10px]">Target Resource:</span>
                  <span className="text-slate-800 font-medium">{selectedLog.resource}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Category:</span>
                    <span className="text-slate-800 font-medium capitalize">{selectedLog.resourceType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px]">Timestamp:</span>
                    <span className="text-slate-800 font-medium">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div>
                    <span className="text-slate-400 block font-semibold uppercase text-[10px] mb-1">
                      Event Metadata (JSON):
                    </span>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
