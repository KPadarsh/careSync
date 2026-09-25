import React from "react";
import Link from "next/link";

export interface PatientStatItem {
  id: string;
  label: string;
  value: string | number;
  badge?: string | number;
  type: "info" | "success" | "warning" | "error";
  href: string;
  icon: React.ReactNode;
}

const defaultStats: PatientStatItem[] = [
  {
    id: "upcoming-appts",
    label: "Upcoming Appts",
    value: 2,
    badge: 2,
    type: "info",
    href: "/patient/appointments",
    icon: (
      <svg className="h-5 w-5 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "active-rx",
    label: "Active Rx",
    value: 1,
    badge: 1,
    type: "success",
    href: "/patient/prescriptions",
    icon: (
      <svg className="h-5 w-5 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    id: "pending-labs",
    label: "Pending Labs",
    value: 3,
    badge: 3,
    type: "warning",
    href: "/patient/lab-reports",
    icon: (
      <svg className="h-5 w-5 text-[#f59e0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    id: "outstanding-bills",
    label: "Outstanding Bills",
    value: "$1,250",
    type: "error",
    href: "/patient/billing",
    icon: (
      <svg className="h-5 w-5 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
];

const badgeStyles: Record<string, { bg: string; text: string }> = {
  info: { bg: "bg-[#3b82f6]/10", text: "text-[#3b82f6]" },
  success: { bg: "bg-[#22c55e]/10", text: "text-[#22c55e]" },
  warning: { bg: "bg-[#f59e0b]/10", text: "text-[#f59e0b]" },
  error: { bg: "bg-[#ef4444]/10", text: "text-[#ef4444]" },
};

export function PatientStats({ stats = defaultStats }: { stats?: PatientStatItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((item) => {
        const style = badgeStyles[item.type];
        return (
          <Link
            key={item.id}
            href={item.href}
            className="group block"
          >
            <div
              className="bg-white rounded-lg p-4 border border-[#e2e8f0] shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] hover:shadow-md transition-shadow cursor-pointer h-full"
            >
              <div className="flex justify-between items-start mb-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bg}`}
                >
                  {item.icon}
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-[#0b1c30] leading-none mb-1 group-hover:text-[#131b2e] transition-colors">
                {item.value}
              </h3>
              <p className="text-xs font-medium text-[#45464d]">
                {item.label}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
