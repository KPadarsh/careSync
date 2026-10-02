"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  InvoicesIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  RefreshIcon,
} from "./BillingIcons";

export function InvoicesView() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/billing/invoices", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err: any) {
      setError(err.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Paid
          </span>
        );
      case "partially_paid":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Partially Paid
          </span>
        );
      case "pending":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pending Payment
          </span>
        );
      case "overdue":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Overdue
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-600">
              ACCOUNTS RECEIVABLE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Patient Invoices &amp; Billing Records
          </h1>
          <p className="text-sm text-slate-500">
            Review issued patient billing statements, track balances, and process collections.
          </p>
        </div>

        <Link
          href="/billing/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create New Invoice</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "all", label: "All Invoices" },
            { id: "pending", label: "Pending" },
            { id: "partially_paid", label: "Partially Paid" },
            { id: "paid", label: "Paid" },
            { id: "overdue", label: "Overdue" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice #, patient, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <SearchIcon className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading invoices...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600 font-semibold">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No invoices found matching selected filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Date Issued</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Outstanding Balance</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                        {inv.invoiceNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors text-sm">
                        {inv.patientId?.name || "Patient"}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        MRN: {inv.patientId?.mrn || "MRN-0000"} • {inv.patientId?.gender || "Unknown"}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600 font-mono text-[11px]">
                      {new Date(inv.date || inv.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-4 font-mono text-[11px]">
                      <span
                        className={
                          inv.status === "overdue"
                            ? "text-rose-600 font-bold"
                            : "text-slate-600"
                        }
                      >
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-sm text-slate-900">
                      ${inv.totalAmount?.toFixed(2)}
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-sm">
                      <span
                        className={
                          inv.balanceAmount === 0
                            ? "text-emerald-600"
                            : inv.status === "overdue"
                            ? "text-rose-600"
                            : "text-amber-600"
                        }
                      >
                        ${inv.balanceAmount?.toFixed(2)}
                      </span>
                    </td>

                    <td className="px-5 py-4">{getStatusBadge(inv.status)}</td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/billing/invoices/${inv._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200/80 transition-colors"
                      >
                        <span>{inv.balanceAmount > 0 ? "Collect / View" : "Details"}</span>
                        <span>→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
