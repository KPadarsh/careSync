import React from "react";

export interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className = "" }: DataTableProps) {
  return (
    <div className={`w-full overflow-hidden bg-white rounded-xl border border-slate-200/80 shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {children}
        </table>
      </div>
    </div>
  );
}

export function DataTableHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={`bg-slate-50/80 border-b border-slate-200/80 ${className}`}>
      {children}
    </thead>
  );
}

export function DataTableBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <tbody className={`divide-y divide-slate-100 text-slate-700 ${className}`}>
      {children}
    </tbody>
  );
}

export function DataTableRow({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors hover:bg-slate-50/60 ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

export function DataTableHead({
  children,
  className = "",
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}) {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <th
      className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${alignClass} ${className}`}
    >
      {children}
    </th>
  );
}

export function DataTableCell({
  children,
  className = "",
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}) {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  return (
    <td className={`px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap ${alignClass} ${className}`}>
      {children}
    </td>
  );
}
