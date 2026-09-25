import React from "react";
import Link from "next/link";

export interface QuickActionItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const defaultActions: QuickActionItem[] = [
  {
    id: "book-appt",
    label: "Book Appt",
    href: "/patient/appointments",
    icon: (
      <svg className="h-5 w-5 text-[#131b2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "records",
    label: "Records",
    href: "/patient/medical-records",
    icon: (
      <svg className="h-5 w-5 text-[#131b2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    href: "/patient/prescriptions",
    icon: (
      <svg className="h-5 w-5 text-[#131b2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    id: "lab-reports",
    label: "Lab Reports",
    href: "/patient/lab-reports",
    icon: (
      <svg className="h-5 w-5 text-[#131b2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "pay-bill",
    label: "Pay Bill",
    href: "/patient/billing",
    icon: (
      <svg className="h-5 w-5 text-[#131b2e]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
];

export function QuickActions({ actions = defaultActions }: { actions?: QuickActionItem[] }) {
  return (
    <section>
      <h3 className="text-base font-semibold text-[#0b1c30] mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {actions.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center justify-center p-4 bg-white border border-[#e2e8f0] rounded-lg hover:border-[#131b2e] hover:shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] transition-all group text-center h-full cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-[#eff4ff] flex items-center justify-center mb-3 group-hover:bg-[#131b2e]/10 transition-colors">
              {item.icon}
            </div>
            <span className="text-xs font-medium text-[#0b1c30]">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
