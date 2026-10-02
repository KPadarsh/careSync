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
    default: "bg-slate-50 text-slate-600 border-slate-200/60",
    primary: "bg-teal-50 text-teal-700 border-teal-200/60",
    info: "bg-blue-50 text-blue-700 border-blue-200/60",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    danger: "bg-rose-50 text-rose-700 border-rose-200/60",
  };

  const iconStyle = tone ? toneMap[tone] : "bg-slate-50 text-slate-600 border-slate-100";

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
            {trend && (
              <span
                className={`font-semibold inline-flex items-center gap-0.5 ${
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
                {trend.label && (
                  <span className="text-slate-400 font-normal ml-1">
                    {trend.label}
                  </span>
                )}
              </span>
            )}
            {badge}
            {subtext && <span className="text-slate-500">{subtext}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
