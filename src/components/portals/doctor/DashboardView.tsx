"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006194] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-[#565e74]">
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
    <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
            Dashboard
          </h1>
          <p className="text-[14px] text-[#565e74] mt-0.5">
            Good morning, {data?.doctor?.name || "Dr. Anil Kumar"}. Here's your schedule for today.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eff4ff] text-[#565e74]">
            <span className="w-2 h-2 rounded-full bg-[#006194]" />
            <span className="text-[13px] text-[#0b1c30] font-semibold">{todayStr}</span>
            <span className="w-1 h-1 rounded-full bg-[#bfc7d2]" />
            <span className="text-[12px] text-[#565e74]">
              {data?.doctor?.roomNumber || "Room 302"}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            type="button"
            className="p-2 rounded-lg bg-white border border-[#bfc7d2]/50 text-[#565e74] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-all shadow-xs"
            title="Refresh"
          >
            <RefreshIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4 Operational Metric Cards (No unnecessary analytics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Patients */}
        <div className="p-5 bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#565e74]">
              Today's Patients
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#006194]">
              <StethoscopeIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0b1c30] leading-none">
              {stats.totalToday}
            </span>
            <span className="text-[12px] text-[#565e74]">
              {stats.todayConsultationsCount} completed
            </span>
          </div>
        </div>

        {/* Card 2: Waiting (Patients handed off by nursing) */}
        <div className="p-5 bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#565e74]">
              Patients Waiting
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0b1c30] leading-none">
              {stats.waitingCount}
            </span>
            <span className="text-[12px] text-[#565e74]">Next ready</span>
          </div>
        </div>

        {/* Card 3: In Consultation */}
        <div className="p-5 bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#565e74]">
              In Consultation
            </span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006194] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#006194]" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0b1c30] leading-none">
              {stats.inConsultationCount}
            </span>
            <span className="text-[12px] text-[#565e74]">
              {data?.doctor?.roomNumber || "Room 302"} active
            </span>
          </div>
        </div>

        {/* Card 4: Follow-ups Today */}
        <div className="p-5 bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#565e74]">
              Follow-ups Today
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#565e74]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#0b1c30] leading-none">
              {stats.followUpsTodayCount}
            </span>
            <span className="text-[12px] text-[#565e74]">Scheduled reviews</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Table (8 cols) + Right Info Cards (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Today's Appointments Table */}
        <div className="lg:col-span-8 flex flex-col bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 overflow-hidden">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#bfc7d2]/20">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-[#0b1c30]">
                Today's Appointments
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[12px] text-[#565e74] font-medium">
                {stats.waitingCount + stats.inConsultationCount} Remaining
              </span>
            </div>
            <Link
              href="/doctor/queue"
              className="text-[13px] font-medium text-[#006194] hover:underline flex items-center gap-1"
            >
              <span>View Full Queue</span>
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#eff4ff]/60 h-9 border-b border-[#bfc7d2]/20">
                  <th className="px-4 py-2 text-[12px] text-[#565e74] uppercase tracking-wider font-semibold">
                    Time
                  </th>
                  <th className="px-4 py-2 text-[12px] text-[#565e74] uppercase tracking-wider font-semibold">
                    Patient
                  </th>
                  <th className="px-4 py-2 text-[12px] text-[#565e74] uppercase tracking-wider font-semibold">
                    Reason
                  </th>
                  <th className="px-4 py-2 text-[12px] text-[#565e74] uppercase tracking-wider font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-2 text-[12px] text-[#565e74] uppercase tracking-wider font-semibold text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bfc7d2]/20">
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#565e74]">
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
                            ? "bg-[#006194]/5 hover:bg-[#006194]/10"
                            : "hover:bg-[#eff4ff]/40"
                        }`}
                      >
                        <td className="px-4 py-3 text-[13px] font-semibold text-[#0b1c30] whitespace-nowrap">
                          {item.appointment.timeSlot}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Link
                            href={`/doctor/patients/${item.patient._id}`}
                            className="flex flex-col group"
                          >
                            <span className="text-[14px] font-semibold text-[#0b1c30] group-hover:text-[#006194] transition-colors">
                              {item.patient.name}
                            </span>
                            <span className="text-[12px] text-[#565e74]">
                              {item.patient.gender}, {item.patient.age}y • {item.patient.mrn}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[13px] text-[#0b1c30]">
                            {item.appointment.reason}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isWaiting && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[12px] font-medium border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Ready for Doctor
                            </span>
                          )}
                          {isInConsultation && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#cce5ff] text-[#004b73] text-[12px] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#006194] animate-pulse" />
                              In Consultation
                            </span>
                          )}
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[12px] font-medium border border-emerald-200">
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
                              className="h-8 px-3 rounded-lg bg-[#006194] hover:bg-[#007bb9] text-white text-[12px] font-semibold transition-colors shadow-xs inline-flex items-center gap-1"
                            >
                              <span>Start Consultation</span>
                              <ArrowForwardIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isInConsultation && (
                            <button
                              onClick={() => router.push(`/doctor/consultations/${item.patient._id}`)}
                              type="button"
                              className="h-8 px-3 rounded-lg bg-white border border-[#006194] text-[#006194] hover:bg-[#eff4ff] text-[12px] font-semibold shadow-xs transition-colors inline-flex items-center gap-1"
                            >
                              <span>Continue</span>
                              <ArrowForwardIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isCompleted && (
                            <Link
                              href={`/doctor/patients/${item.patient._id}`}
                              className="h-8 px-3 rounded-lg text-[#565e74] hover:text-[#0b1c30] hover:bg-[#eff4ff] text-[12px] font-medium transition-colors inline-flex items-center gap-1"
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
          <div className="bg-white p-5 rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Quick Attention
              </h3>
              <AlertTriangleIcon className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex flex-col gap-3">
              {quickAttention.length === 0 ? (
                <p className="text-[13px] text-[#565e74]">
                  No urgent alerts. All vitals and triage priorities normal.
                </p>
              ) : (
                quickAttention.map((item, idx) => (
                  <Link
                    key={idx}
                    href={`/doctor/patients/${item.patientId}`}
                    className="p-3 rounded-lg bg-[#eff4ff]/60 flex flex-col gap-1 hover:bg-[#eff4ff] transition-colors border border-[#bfc7d2]/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-[#0b1c30]">
                        {item.patientName}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.badgeType === "error"
                            ? "bg-[#ffdad6] text-[#ba1a1a]"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {item.badgeText}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#565e74] leading-snug">
                      {item.description}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-5 rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Recent Activity
              </h3>
              <ClockIcon className="w-4 h-4 text-[#565e74]" />
            </div>
            <div className="flex flex-col gap-3.5 pl-1">
              {recentActivity.length === 0 ? (
                <p className="text-[13px] text-[#565e74]">
                  No recent activities recorded yet.
                </p>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 relative">
                    <div className="w-2 h-2 rounded-full bg-[#006194] mt-1.5 shrink-0" />
                    <div className="flex flex-col">
                      <p className="text-[13px] text-[#0b1c30] leading-snug">
                        {act.title}
                      </p>
                      <span className="text-[11px] text-[#565e74] mt-0.5">
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
