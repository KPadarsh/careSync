"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircleIcon,
  SearchIcon,
  CreditCardIcon,
  FileTextIcon,
  DollarSignIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  PrinterIcon,
} from "./BillingShell";

interface OutstandingInvoice {
  _id: string;
  invoiceNumber: string;
  patientId?: {
    _id: string;
    fullName?: string;
    mrn?: string;
    phone?: string;
  };
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: "issued" | "pending" | "partially_paid" | "overdue";
  agingDays: number;
  agingBucket: "current" | "30_days" | "60_days" | "90_plus";
  servicesCount: number;
}

interface OutstandingSummary {
  totalOutstanding: number;
  totalInvoicesCount: number;
  agingSummary: {
    current: number;
    thirtyDays: number;
    sixtyDays: number;
    ninetyPlus: number;
  };
}

export function OutstandingView() {
  const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
  const [summary, setSummary] = useState<OutstandingSummary>({
    totalOutstanding: 0,
    totalInvoicesCount: 0,
    agingSummary: { current: 0, thirtyDays: 0, sixtyDays: 0, ninetyPlus: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [agingFilter, setAgingFilter] = useState("all");

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/outstanding");
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
        setSummary({
          totalOutstanding: data.totalOutstanding || 0,
          totalInvoicesCount: data.totalInvoicesCount || 0,
          agingSummary: data.agingSummary || {
            current: 0,
            thirtyDays: 0,
            sixtyDays: 0,
            ninetyPlus: 0,
          },
        });
      }
    } catch (err) {
      console.error("Error loading outstanding invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutstanding();
  }, []);

  const filtered = invoices.filter((inv) => {
    const pName = inv.patientId?.fullName?.toLowerCase() || "";
    const pMrn = inv.patientId?.mrn?.toLowerCase() || "";
    const invNum = inv.invoiceNumber.toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch =
      pName.includes(query) || pMrn.includes(query) || invNum.includes(query);

    if (!matchesSearch) return false;
    if (agingFilter === "all") return true;
    return inv.agingBucket === agingFilter;
  });

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Accounts Receivable & Outstanding Balances
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Active ledger of unpaid and partially settled patient accounts
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchOutstanding()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <PrinterIcon className="w-4 h-4" />
              Export AR Report
            </button>
          </div>
        </div>

        {/* Aging Buckets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Outstanding
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSignIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ${summary.totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Across {summary.totalInvoicesCount} pending invoices
            </div>
          </div>

          <div
            onClick={() => setAgingFilter(agingFilter === "current" ? "all" : "current")}
            className={`cursor-pointer transition border rounded-xl p-5 shadow-sm ${
              agingFilter === "current"
                ? "bg-blue-50/50 border-blue-300 ring-2 ring-blue-500"
                : "bg-white border-slate-200 hover:border-blue-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Current (&lt; 30 Days)
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                Normal
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ${summary.agingSummary.current.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-blue-600 font-medium mt-1">Click to filter</div>
          </div>

          <div
            onClick={() => setAgingFilter(agingFilter === "30_days" ? "all" : "30_days")}
            className={`cursor-pointer transition border rounded-xl p-5 shadow-sm ${
              agingFilter === "30_days"
                ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-500"
                : "bg-white border-slate-200 hover:border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                30–60 Days
              </span>
              <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                Follow-up
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ${summary.agingSummary.thirtyDays.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-amber-600 font-medium mt-1">Click to filter</div>
          </div>

          <div
            onClick={() => setAgingFilter(agingFilter === "60_days" ? "all" : "60_days")}
            className={`cursor-pointer transition border rounded-xl p-5 shadow-sm ${
              agingFilter === "60_days"
                ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-500"
                : "bg-white border-slate-200 hover:border-rose-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                60+ Days Overdue
              </span>
              <span className="text-xs bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded-full">
                Urgent
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              ${(summary.agingSummary.sixtyDays + summary.agingSummary.ninetyPlus).toLocaleString(
                "en-US",
                { minimumFractionDigits: 2 }
              )}
            </div>
            <div className="text-xs text-rose-600 font-medium mt-1">Click to filter</div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient, MRN, invoice #..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Aging:</span>
            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Outstanding</option>
              <option value="current">Current (&lt; 30 Days)</option>
              <option value="30_days">30–60 Days</option>
              <option value="60_days">60–90 Days</option>
              <option value="90_plus">90+ Days</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading outstanding balances...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <DollarSignIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No outstanding invoices</h3>
              <p className="text-sm text-slate-500 mt-1">
                {searchTerm || agingFilter !== "all"
                  ? "Try changing your search or aging filter."
                  : "All patient billing accounts are currently settled."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient / MRN</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Aging</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right font-bold text-rose-700">Balance Due</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv) => {
                    const isOverdue = inv.agingDays > 0;
                    return (
                      <tr key={inv._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                          <Link
                            href={`/billing/invoices/${inv._id}`}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1.5"
                          >
                            <FileTextIcon className="w-3.5 h-3.5 text-slate-400" />
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">
                            {inv.patientId?.fullName || "Unassigned"}
                          </div>
                          <div className="text-xs font-mono text-slate-400">
                            {inv.patientId?.mrn || "—"}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {new Date(inv.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          {inv.agingDays > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                inv.agingDays > 60
                                  ? "bg-rose-100 text-rose-800"
                                  : inv.agingDays > 30
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              <AlertCircleIcon className="w-3 h-3" />
                              {inv.agingDays}d overdue
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right text-slate-700">
                          ${inv.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right text-emerald-600 font-medium">
                          ${inv.paidAmount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                          ${inv.balanceAmount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/billing/invoices/${inv._id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition shadow-sm"
                          >
                            <CreditCardIcon className="w-3.5 h-3.5" />
                            Collect
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  );
}
