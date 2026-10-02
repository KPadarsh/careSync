import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode | { label: string; tone?: "default" | "primary" | "info" | "success" | "warning" | "danger" };
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  breadcrumbs,
  actions,
  action,
  className = "",
}: PageHeaderProps) {
  const actionContent = actions || action;

  const renderBadge = () => {
    if (!badge) return null;
    if (React.isValidElement(badge) || typeof badge === "string" || typeof badge === "number") {
      return badge;
    }
    if (typeof badge === "object" && "label" in badge) {
      const toneMap = {
        default: "bg-slate-100 text-slate-700 border-slate-200",
        primary: "bg-teal-50 text-teal-700 border-teal-200",
        info: "bg-blue-50 text-blue-700 border-blue-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
      };
      const tone = (badge as any).tone || "default";
      const cls = toneMap[tone as keyof typeof toneMap] || toneMap.default;
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
          {(badge as any).label}
        </span>
      );
    }
    return null;
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 ${className}`}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-slate-600 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-slate-600 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {title}
          </h1>
          {renderBadge()}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actionContent && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {actionContent}
        </div>
      )}
    </div>
  );
}
