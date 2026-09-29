"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  InvoicesIcon,
  PaymentsIcon,
  OutstandingIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  PlusIcon,
} from "./BillingIcons";

export function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/dashboard");
      if (!res.ok) throw new Error("Failed to load billing dashboard data");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Billing Operations Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <p className="font-semibold">Error: {error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentInvoices, recentPayments, recentActivity } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0D1C38] to-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl shadow-slate-950/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">
              REVENUE CYCLE MANAGEMENT
            </span>
            <span className="text-xs text-slate-400">• Cashier Counter 01</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Patient Financial Services Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Monitor daily billing collections, track accounts receivable, and process payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-semibold transition-all hover:scale-102"
          >
            <RefreshIcon className="w-4 h-4 text-blue-400" />
            <span>Refresh Ledger</span>
          </button>
          <Link
            href="/billing/invoices/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-950/40 transition-all hover:scale-102"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Create Invoice</span>
          </Link>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Invoices Today */}
        <Link
          href="/billing/invoices"
          className="group relative overflow-hidden p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900/80 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Invoices Today
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <InvoicesIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            ${stats.invoicesTodayAmount?.toFixed(2) || "0.00"}
          </div>
          <div className="mt-2 flex items-center text-xs text-blue-400/90 font-medium">
            <span>{stats.invoicesTodayCount} invoice(s) generated today</span>
          </div>
        </Link>

        {/* Payments Today */}
        <Link
          href="/billing/payments"
          className="group relative overflow-hidden p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Payments Today
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PaymentsIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 tracking-tight">
            ${stats.paymentsTodayAmount?.toFixed(2) || "0.00"}
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400/90 font-medium">
            <span>{stats.paymentsTodayCount} transaction(s) settled today</span>
          </div>
        </Link>

        {/* Outstanding Balances */}
        <Link
          href="/billing/outstanding"
          className="group relative overflow-hidden p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/80 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Outstanding Balances
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <OutstandingIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-amber-400 tracking-tight">
            ${stats.outstandingBalancesAmount?.toFixed(2) || "0.00"}
          </div>
          <div className="mt-2 flex items-center text-xs text-amber-400/90 font-medium">
            <span>{stats.outstandingCount} open accounts receivable</span>
          </div>
        </Link>

        {/* Pending Payments / Overdue */}
        <Link
          href="/billing/outstanding?status=overdue"
          className="group relative overflow-hidden p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 hover:border-rose-500/50 hover:bg-slate-900/80 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pending / Overdue
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 tracking-tight">
            {stats.pendingPaymentsCount}
          </div>
          <div className="mt-2 flex items-center text-xs text-rose-400/90 font-medium">
            <span>{stats.overdueCount} account(s) overdue</span>
          </div>
        </Link>
      </div>

      {/* TWO COLUMN GRID: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <h2 className="text-base font-bold text-white">Recent Invoices Issued</h2>
            </div>
            <Link
              href="/billing/invoices"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              View All Invoices →
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No recent invoices recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv: any) => (
                <Link
                  key={inv._id}
                  href={`/billing/invoices/${inv._id}`}
                  className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 hover:bg-slate-800/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                          {inv.patientId?.name || "Patient"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        MRN: {inv.patientId?.mrn} • {new Date(inv.date || inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-white">
                        ${inv.totalAmount?.toFixed(2)}
                      </span>
                      <div className="mt-0.5">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            inv.status === "paid"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : inv.status === "partially_paid"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : inv.status === "overdue"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {inv.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {inv.balanceAmount > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Remaining Balance:</span>
                      <span className="font-bold text-amber-400">
                        ${inv.balanceAmount?.toFixed(2)}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments Collected */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-base font-bold text-white">Recent Payments Collected</h2>
            </div>
            <Link
              href="/billing/payments"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              All Payments →
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No payments collected yet today.
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p: any) => (
                <Link
                  key={p._id}
                  href={`/billing/payments/${p._id}`}
                  className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                          {p.transactionNumber}
                        </span>
                        <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {p.patientId?.name || "Patient"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 capitalize">
                        Method: {p.paymentMethod.replace("_", " ")} • Ref: {p.referenceNumber || "Direct"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">
                        +${p.amount?.toFixed(2)}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(p.paymentDate || p.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RECENT BILLING ACTIVITY AUDIT LOG */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <h2 className="text-base font-bold text-white">Recent Financial Activity Audit</h2>
          </div>
          <Link
            href="/billing/history"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Full Ledger History →
          </Link>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">
            No financial activity recorded.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {recentActivity.map((act: any) => (
              <div key={act.id} className="py-3.5 flex items-start gap-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    act.type === "payment"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {act.type === "payment" ? (
                    <PaymentsIcon className="w-4 h-4" />
                  ) : (
                    <InvoicesIcon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-white">{act.title}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.time).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate mt-0.5">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
