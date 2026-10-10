import React from "react";

export interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  tone?: "default" | "primary" | "info" | "success" | "warning" | "danger";
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  badge?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  label,
  value,
  subtext,
  icon,
  tone,
  trend,
  badge,
  className = "",
}: StatCardProps) {
  const displayTitle = title || label || "";

  const toneMap = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-teal-50 text-teal-800 border-teal-200/80",
    info: "bg-sky-50 text-sky-800 border-sky-200/80",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
    warning: "bg-amber-50 text-amber-800 border-amber-200/80",
    danger: "bg-rose-50 text-rose-800 border-rose-200/80",
  };

  const iconStyle = tone ? toneMap[tone] : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {displayTitle}
        </span>
        {icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconStyle}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none">
          {value}
        </div>

        {(subtext || trend || badge) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
            {trend && (
              <span
                className={`font-semibold inline-flex items-center gap-0.5 ${
                  trend.isPositive ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
                {trend.label && (
                  <span className="text-slate-500 font-normal ml-1">
                    {trend.label}
                  </span>
                )}
              </span>
            )}
            {badge}
            {subtext && <span className="text-slate-600 font-medium">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
