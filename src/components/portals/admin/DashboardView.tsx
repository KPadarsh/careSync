"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  StaffIcon,
  DoctorsIcon,
  DepartmentsIcon,
  SchedulesIcon,
  UsersIcon,
  PlusIcon,
  ChevronRightIcon,
  RefreshIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ShieldIcon,
  ClockIcon,
} from "./AdminShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";

interface DashboardData {
  stats: {
    totalStaff: number;
    totalDoctors: number;
    totalDepartments: number;
    totalUsers: number;
    pendingAdminTasks: number;
  };
  staffOverview: {
    total: number;
    byRole: Record<string, number>;
    recent: any[];
  };
  doctorOverview: {
    total: number;
    recent: any[];
  };
  departments: any[];
  todayStaffSchedule: any[];
  pendingTasks: any[];
  adminAlerts: any[];
  recentAuditLogs: any[];
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <AdminShell activeKey="dashboard">
      <div className="space-y-6">
        {/* Header with Quick Actions */}
        <PageHeader
          title="Hospital Operations & System Infrastructure"
          description="Manage facility departments, personnel credentials, shift rosters, and security policies."
          badge={{ label: "Administrative Console", tone: "info" }}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchDashboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs"
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <Link
                href="/admin/staff/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Add Staff</span>
              </Link>
              <Link
                href="/admin/doctors/new"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-xs"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                <span>Add Doctor</span>
              </Link>
            </div>
          }
        />

        {/* Operational Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Staff"
            value={data?.stats.totalStaff ?? 0}
            subtext="across 6 clinical roles"
            icon={<StaffIcon className="w-5 h-5" />}
            tone="info"
          />
          <StatCard
            label="Doctors"
            value={data?.stats.totalDoctors ?? 0}
            subtext="with active clinical suites"
            icon={<DoctorsIcon className="w-5 h-5" />}
            tone="primary"
          />
          <StatCard
            label="Departments"
            value={data?.stats.totalDepartments ?? 0}
            subtext="100% operational in facility"
            icon={<DepartmentsIcon className="w-5 h-5" />}
            tone="success"
          />
          <StatCard
            label="Pending Admin Tasks"
            value={data?.stats.pendingAdminTasks ?? 0}
            subtext="Compliance & roster reviews"
            icon={<AlertTriangleIcon className="w-5 h-5" />}
            tone={(data?.stats.pendingAdminTasks ?? 0) > 0 ? "warning" : "default"}
          />
        </div>

        {/* Quick Action Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Quick System Actions:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/staff/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <PlusIcon className="w-3.5 h-3.5 text-indigo-600" />
              Add Staff
            </Link>
            <Link
              href="/admin/doctors/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <PlusIcon className="w-3.5 h-3.5 text-indigo-600" />
              Add Doctor
            </Link>
            <Link
              href="/admin/departments/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <PlusIcon className="w-3.5 h-3.5 text-indigo-600" />
              Add Department
            </Link>
            <Link
              href="/admin/schedules"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <SchedulesIcon className="w-3.5 h-3.5 text-indigo-600" />
              Manage Schedules
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <UsersIcon className="w-3.5 h-3.5 text-indigo-600" />
              Manage Users
            </Link>
          </div>
        </div>

        {/* 2-Column Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Staff Schedule (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">Today&apos;s Staff & Doctor Duty Schedule</h2>
                </div>
                <Link
                  href="/admin/schedules"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  View Full Roster
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading duty schedules...</div>
              ) : !data?.todayStaffSchedule?.length ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No shifts scheduled for today.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 mt-2">
                  {data.todayStaffSchedule.map((item, idx) => (
                    <div
                      key={item._id || idx}
                      className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                            item.personType === "doctor"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {item.personType === "doctor" ? "DR" : "ST"}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {item.personName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.role} • {item.department}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-slate-700">
                            {item.startTime} - {item.endTime}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.station}</div>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            item.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Staff Overview Breakdown */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <StaffIcon className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Staff Overview by Subsystem Role</h2>
                </div>
                <Link
                  href="/admin/staff"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  Manage Personnel
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {data?.staffOverview?.byRole &&
                  Object.entries(data.staffOverview.byRole).map(([role, count]) => (
                    <div key={role} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500 capitalize">{role.replace("_", " ")}</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">{count}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Right Column: Pending Admin Tasks & Alerts (1 Col) */}
          <div className="space-y-6">
            {/* Pending Admin Tasks */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Pending Administrative Tasks</h3>
                <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                  {data?.pendingTasks?.length || 0}
                </span>
              </div>

              <div className="divide-y divide-slate-100 mt-2 space-y-2">
                {data?.pendingTasks?.map((task) => (
                  <div key={task.id} className="pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">{task.title}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          task.priority === "high"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      Due: {task.dueDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Administrative Alerts */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">System & Security Alerts</h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  Normal
                </span>
              </div>

              <div className="space-y-3">
                {data?.adminAlerts?.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                      {alert.title}
                    </div>
                    <p className="text-slate-500 mt-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Audit Log Preview */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Recent Audit Activity</h3>
                <Link
                  href="/admin/audit-logs"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  All Logs
                </Link>
              </div>

              <div className="space-y-2.5 mt-3">
                {data?.recentAuditLogs?.slice(0, 4).map((log, idx) => (
                  <div key={log._id || idx} className="text-xs border-b border-slate-50 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-800 font-semibold">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] truncate mt-0.5">{log.resource}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
