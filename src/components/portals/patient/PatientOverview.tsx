"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PatientStats, PatientStatItem } from "./PatientStats";
import { UpcomingAppointmentCard } from "./UpcomingAppointmentCard";
import { QuickActions } from "./QuickActions";
import { HealthProfileCard } from "./HealthProfileCard";
import { RecentActivityFeed, ActivityItem } from "./RecentActivityFeed";

interface DashboardData {
  patient: {
    name: string;
    mrn: string;
    bloodGroup: string;
    age: string;
    primaryDoctor: string;
    lastVisit: string;
  };
  stats: {
    upcomingAppointments: number;
    activePrescriptions: number;
    pendingLabs: number;
    outstandingBills: string;
  };
  nextAppointment: {
    id: string;
    doctorName: string;
    specialty: string;
    date: string;
    time: string;
    status: string;
    location: string;
    avatarUrl?: string;
  } | null;
  todayVisit: {
    id: string;
    doctorName: string;
    reason: string;
    summary: string;
    status: string;
  } | null;
  activeFollowUp: {
    id: string;
    doctorName: string;
    recommendedDate: string;
    reason: string;
    instructions: string;
  } | null;
  recentActivity: ActivityItem[];
}

export function PatientOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patient/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json);
        }
      })
      .catch((err) => console.error("Error loading dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const statsItems: PatientStatItem[] | undefined = data
    ? [
        {
          id: "upcoming-appts",
          label: "Upcoming Appts",
          value: data.stats.upcomingAppointments,
          badge: data.stats.upcomingAppointments,
          type: "info",
          href: "/patient/appointments",
          icon: (
            <svg className="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: "active-rx",
          label: "Active Rx",
          value: data.stats.activePrescriptions,
          badge: data.stats.activePrescriptions,
          type: "success",
          href: "/patient/prescriptions",
          icon: (
            <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          ),
        },
        {
          id: "pending-labs",
          label: "Verified Labs",
          value: data.stats.pendingLabs,
          badge: data.stats.pendingLabs,
          type: "warning",
          href: "/patient/lab-reports",
          icon: (
            <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
        {
          id: "outstanding-bills",
          label: "Outstanding Bills",
          value: data.stats.outstandingBills,
          type: "error",
          href: "/patient/billing",
          icon: (
            <svg className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          ),
        },
      ]
    : undefined;

  const patientName = data?.patient.name?.split(" ")[0] || "Rahul";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-slate-500">Loading your health overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header with Greeting & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-[32px] sm:leading-[40px] font-bold text-[#0b1c30] tracking-tight">
            Good morning, {patientName}
          </h2>
          <p className="text-sm text-[#45464d] mt-1">
            Here is your health overview and scheduled clinical activities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/patient/appointments">
            <button
              type="button"
              className="px-4 py-2 bg-[#131b2e] text-white rounded-lg shadow-sm text-sm font-medium hover:bg-[#213145] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Book Appointment</span>
            </button>
          </Link>

          <Link href="/patient/lab-reports">
            <button
              type="button"
              className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg shadow-sm text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Report</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Follow-up Reminder Banner (if any active follow-up from doctor) */}
      {data?.activeFollowUp && (
        <div className="bg-[#eff4ff] border-l-4 border-[#006a61] p-4 rounded-xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#89f5e7]/30 text-[#006a61] flex items-center justify-center shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider">
                Follow-up Notice: {data.activeFollowUp.reason}
              </h4>
              <p className="text-xs text-[#45464d] mt-0.5">
                Recommended by {data.activeFollowUp.doctorName} for {data.activeFollowUp.recommendedDate}
              </p>
            </div>
          </div>
          <Link
            href="/patient/follow-ups"
            className="px-3.5 py-1.5 bg-[#006a61] text-white text-xs font-semibold rounded-lg hover:bg-[#005049] transition-colors shrink-0"
          >
            Review &amp; Schedule
          </Link>
        </div>
      )}

      {/* Main 12-Column Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Stats, Spotlight & Quick Actions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stat Cards */}
          <PatientStats stats={statsItems} />

          {/* Next Appointment Spotlight */}
          {data?.nextAppointment ? (
            <UpcomingAppointmentCard
              doctorName={data.nextAppointment.doctorName}
              specialty={data.nextAppointment.specialty}
              date={data.nextAppointment.date}
              time={data.nextAppointment.time}
              status={data.nextAppointment.status}
              location={data.nextAppointment.location}
              avatarUrl={data.nextAppointment.avatarUrl}
            />
          ) : (
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-[#0b1c30]">No Upcoming Appointments</p>
              <p className="text-xs text-[#45464d]">
                You have no scheduled consultations. Book one anytime with our medical staff.
              </p>
              <div className="pt-2">
                <Link
                  href="/patient/appointments"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#131b2e] text-white text-xs font-semibold rounded-lg hover:bg-[#213145]"
                >
                  Book an Appointment
                </Link>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Right Column (4 cols): Health Profile & Timeline */}
        <div className="lg:col-span-4 space-y-6">
          {/* Health Profile Widget */}
          <HealthProfileCard
            bloodGroup={data?.patient.bloodGroup}
            age={data?.patient.age}
            lastVisit={data?.patient.lastVisit}
            primaryDoctor={data?.patient.primaryDoctor}
          />

          {/* Recent Activity Feed */}
          <RecentActivityFeed activities={data?.recentActivity} />
        </div>
      </div>
    </div>
  );
}
