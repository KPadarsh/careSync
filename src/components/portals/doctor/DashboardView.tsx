"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  ClockIcon,
  ArrowForwardIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  StethoscopeIcon,
} from "./DoctorIcons";

interface DashboardData {
  doctor: {
    name: string;
    specialty: string;
    roomNumber: string;
  };
  stats: {
    waitingCount: number;
    inConsultationCount: number;
    todayConsultationsCount: number;
    pendingLabReportsCount: number;
    followUpsTodayCount: number;
    totalToday: number;
  };
  queue: Array<{
    _id: string;
    ticketNumber: string;
    status: string;
    priority: string;
    roomNumber: string;
    waitingMinutes: number;
    patient: {
      _id: string;
      name: string;
      mrn: string;
      gender: string;
      age: number;
      bloodGroup: string;
      allergies: string[];
    };
    appointment: {
      timeSlot: string;
      reason: string;
      status: string;
    };
    nurseAssessment?: {
      status: string;
      vitals?: {
        bloodPressure?: string;
        heartRate?: number;
      };
      chiefComplaint?: string;
      triagePriority?: string;
      nurseName?: string;
    };
  }>;
  quickAttention: Array<{
    id: string;
    patientName: string;
    patientId: string;
    badgeText: string;
    badgeType: "error" | "warning";
    description: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    detail: string;
    timestamp: string;
  }>;
}

export const DashboardView: React.FC = () => {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/doctor/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load doctor dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const handleStartConsultation = async (patientId: string, queueId?: string) => {
    if (queueId) {
      try {
        await fetch("/api/doctor/queue", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ queueId, action: "start-consultation" }),
        });
      } catch {
        // ignore
      }
    }
    router.push(`/doctor/consultations/${patientId}`);
  };

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">
            Loading doctor schedule...
          </span>
        </div>
      </div>
    );
  }

  const todayStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const stats = data?.stats || {
    waitingCount: 3,
    inConsultationCount: 1,
    todayConsultationsCount: 4,
    pendingLabReportsCount: 2,
    followUpsTodayCount: 2,
    totalToday: 8,
  };

  const queue = data?.queue || [];
  const quickAttention = data?.quickAttention || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header Banner */}
      <PageHeader
        title="Clinical Dashboard"
        description={`Good morning${data?.doctor?.name ? `, ${data.doctor.name}` : ""}. Here's your clinical schedule for today.`}
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            {data?.doctor?.roomNumber || "Consultation Room"}
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-sky-600" />
              <span>{todayStr}</span>
            </div>
            <button
              onClick={handleRefresh}
              type="button"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
              title="Refresh"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* 4 Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/doctor/patients">
          <StatCard
            title="Today's Patients"
            value={stats.totalToday}
            subtext={`${stats.todayConsultationsCount} completed`}
            icon={
              <div className="text-sky-600">
                <StethoscopeIcon className="w-4 h-4" />
              </div>
            }
          />
        </Link>

        <Link href="/doctor/queue">
          <StatCard
            title="Patients Waiting"
            value={stats.waitingCount}
            subtext="Ready for consultation"
            icon={
              <div className="text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              </div>
            }
          />
        </Link>

        <Link href="/doctor/queue">
          <StatCard
            title="In Consultation"
            value={stats.inConsultationCount}
            subtext={`${data?.doctor?.roomNumber || "Room 302"} active`}
            icon={
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-600 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-600" />
              </span>
            }
          />
        </Link>

        <Link href="/doctor/follow-ups">
          <StatCard
            title="Follow-ups Today"
            value={stats.followUpsTodayCount}
            subtext="Scheduled reviews"
            icon={
              <div className="text-slate-600">
                <ClockIcon className="w-4 h-4" />
              </div>
            }
          />
        </Link>
      </div>

      {/* Main Grid: Left Table (8 cols) + Right Info Cards (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Today's Appointments Table */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Today's Appointments
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-xs text-slate-600 font-medium">
                {stats.waitingCount + stats.inConsultationCount} Remaining
              </span>
            </div>
            <Link
              href="/doctor/queue"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <span>View Full Queue</span>
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 h-10 border-b border-slate-200">
                  <th className="px-4 py-2.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Time
                  </th>
                  <th className="px-4 py-2.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Patient
                  </th>
                  <th className="px-4 py-2.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Reason
                  </th>
                  <th className="px-4 py-2.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-[11px] text-slate-500 uppercase tracking-wider font-semibold text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-xs text-slate-400">
                      No queue items for today. All triage assessments clear.
                    </td>
                  </tr>
                ) : (
                  queue.map((item) => {
                    const isWaiting = item.status === "ready-for-doctor" || item.status === "waiting";
                    const isInConsultation = item.status === "in-consultation";
                    const isCompleted = item.status === "completed";

                    return (
                      <tr
                        key={item._id}
                        className={`h-14 transition-colors ${
                          isInConsultation
                            ? "bg-sky-50/40 hover:bg-sky-50/60"
                            : "hover:bg-slate-50/60"
                        }`}
                      >
                        <td className="px-4 py-3 text-xs font-semibold text-slate-900 whitespace-nowrap">
                          {item.appointment.timeSlot}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            href={`/doctor/patients/${item.patient._id}`}
                            className="flex flex-col group"
                          >
                            <span className="text-xs sm:text-[13px] font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                              {item.patient.name}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {item.patient.gender}, {item.patient.age}y • {item.patient.mrn}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-slate-700">
                            {item.appointment.reason}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isWaiting && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Ready for Doctor
                            </span>
                          )}
                          {isInConsultation && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
                              In Consultation
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Completed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isWaiting && (
                            <button
                              onClick={() => handleStartConsultation(item.patient._id, item._id)}
                              type="button"
                              className="h-8 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs inline-flex items-center gap-1"
                            >
                              <span>Start Consultation</span>
                              <ArrowForwardIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isInConsultation && (
                            <button
                              onClick={() => router.push(`/doctor/consultations/${item.patient._id}`)}
                              type="button"
                              className="h-8 px-3 rounded-lg bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors inline-flex items-center gap-1"
                            >
                              <span>Continue</span>
                              <ArrowForwardIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isCompleted && (
                            <Link
                              href={`/doctor/patients/${item.patient._id}`}
                              className="h-8 px-3 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors inline-flex items-center gap-1"
                            >
                              <span>View Chart</span>
                              <ChevronRightIcon className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Attention & Recent Activity */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Quick Attention */}
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Quick Attention
              </h3>
              <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex flex-col gap-2.5">
              {quickAttention.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No urgent alerts. All vitals and triage priorities normal.
                </p>
              ) : (
                quickAttention.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/doctor/patients/${item.patientId}`}
                    className="p-3 rounded-xl bg-slate-50/80 flex flex-col gap-1 hover:bg-slate-100 transition-colors border border-slate-200/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-[13px] font-semibold text-slate-900">
                        {item.patientName}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.badgeType === "error"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">
                      {item.description}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200/80 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Recent Activity
              </h3>
              <ClockIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex flex-col gap-3.5 pl-1">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No recent activities recorded yet.
                </p>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 relative">
                    <div className="w-2 h-2 rounded-full bg-sky-600 mt-1.5 shrink-0" />
                    <div className="flex flex-col">
                      <p className="text-xs text-slate-800 leading-snug font-medium">
                        {act.title}
                      </p>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {act.detail}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
