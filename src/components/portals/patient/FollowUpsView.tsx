"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface FollowUpItem {
  _id: string;
  recommendedDate: string;
  reason: string;
  clinicalInstructions: string;
  status: "pending" | "scheduled" | "completed" | "dismissed";
  doctorId?: {
    _id: string;
    name: string;
    specialty: string;
    department: string;
    roomNumber: string;
    avatar?: string;
  };
  scheduledAppointmentId?: {
    date: string;
    timeSlot: string;
    status: string;
  };
}

export function FollowUpsView() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patient/follow-ups")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.followUps) {
          setFollowUps(data.followUps);
        }
      })
      .catch((err) => console.error("Error loading follow-ups:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Follow-up Care</h2>
          <p className="text-sm text-[#45464d] mt-1">
            Doctor-recommended clinical follow-ups, monitoring instructions, and next consultation dates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-[#e2e8f0] animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-16 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : followUps.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#006a61] mx-auto flex items-center justify-center mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[#0b1c30]">No active follow-ups</h3>
          <p className="text-xs text-[#45464d] max-w-sm mx-auto mt-1">
            You do not currently have any pending doctor-directed follow-up reviews.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {followUps.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm hover:border-[#131b2e]/30 transition-all p-6 flex flex-col justify-between"
            >
              <div>
                {/* Status banner */}
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
                  <span className="text-xs font-semibold text-[#45464d]">
                    Recommended Review Date
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      item.status === "scheduled"
                        ? "bg-[#22c55e]/10 text-[#22c55e]"
                        : "bg-[#f59e0b]/10 text-[#f59e0b]"
                    }`}
                  >
                    {item.status === "scheduled" ? "Scheduled" : "Action Needed"}
                  </span>
                </div>

                {/* Target Date Spotlight */}
                <div className="py-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#eff4ff] text-[#131b2e] flex flex-col items-center justify-center font-bold">
                    <span className="text-[10px] uppercase font-semibold text-[#006a61]">
                      {new Date(item.recommendedDate).toLocaleDateString("en-US", { month: "short" })}
                    </span>
                    <span className="text-lg leading-none">
                      {new Date(item.recommendedDate).getDate()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0b1c30]">{item.reason}</h3>
                    <p className="text-xs text-[#45464d]">
                      {item.doctorId?.name} • {item.doctorId?.specialty}
                    </p>
                  </div>
                </div>

                {/* Clinical Instructions - Read-only for Patient */}
                <div className="bg-[#eff4ff]/60 border border-[#dce9ff] rounded-lg p-3.5 mb-4">
                  <p className="text-[11px] font-bold text-[#006a61] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Doctor Instructions (Read-Only)
                  </p>
                  <p className="text-xs text-[#0b1c30] leading-relaxed">
                    {item.clinicalInstructions}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {item.status === "scheduled" && item.scheduledAppointmentId ? (
                  <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] flex items-center justify-between text-xs">
                    <span className="text-[#45464d]">Appointment booked:</span>
                    <strong className="text-[#0b1c30]">
                      {new Date(item.scheduledAppointmentId.date).toLocaleDateString()} at{" "}
                      {item.scheduledAppointmentId.timeSlot}
                    </strong>
                  </div>
                ) : (
                  <Link
                    href={`/patient/appointments?doctorId=${item.doctorId?._id || ""}&followUpId=${item._id}&reason=${encodeURIComponent(item.reason)}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#131b2e] text-white text-xs font-semibold rounded-lg hover:bg-[#213145] transition-colors cursor-pointer"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Follow-up Appointment
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
