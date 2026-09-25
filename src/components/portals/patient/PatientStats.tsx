import React from "react";
import { Card } from "@/components/ui/Card";

export interface PatientStatItem {
  id: string;
  label: string;
  value: string | number;
  badge?: string | number;
  type: "info" | "success" | "warning" | "error";
  icon: React.ReactNode;
}

const defaultStats: PatientStatItem[] = [
  {
    id: "upcoming-appts",
    label: "Upcoming Appts",
    value: 2,
    badge: 2,
    type: "info",
    icon: (
      <svg className="h-5 w-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
    icon: (
      <svg className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
    icon: (
      <svg className="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "outstanding-bills",
    label: "Outstanding Bills",
    value: "$1,250",
    type: "error",
    icon: (
      <svg className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
      </svg>
    ),
  },
];

const badgeBgStyles: Record<string, string> = {
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

export function PatientStats({ stats = defaultStats }: { stats?: PatientStatItem[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((item) => (
        <Card
          key={item.id}
          className="p-4 transition-all duration-150 hover:shadow-md hover:border-primary/30"
        >
          <div className="flex justify-between items-start mb-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${badgeBgStyles[item.type]}`}
            >
              {item.icon}
            </div>
            {item.badge !== undefined && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeBgStyles[item.type]}`}
              >
                {item.badge}
              </span>
            )}
          </div>
          <h3 className="text-h3 font-bold text-foreground leading-none mb-1">
            {item.value}
          </h3>
          <p className="text-caption text-muted-foreground font-medium">
            {item.label}
          </p>
        </Card>
      ))}
    </div>
  );
}
