"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  InvoicesIcon,
  PaymentsIcon,
  OutstandingIcon,
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
      if (!res.ok) {
        throw new Error("Failed to load billing dashboard data");
      }
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
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading Billing Ledger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
        <p className="font-semibold text-sm">Error: {error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, recentInvoices, recentPayments } = data;

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <PageHeader
        title="Patient Financial Services"
        description="Monitor daily billing collections, track accounts receivable, and process payments."
        badge={{ label: "Cashier Desk 01 Online", tone: "primary" }}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchDashboard}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh Ledger</span>
            </button>
            <Link
              href="/billing/invoices/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Create Invoice</span>
            </Link>
          </div>
        }
      />

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Invoices Today */}
        <Link href="/billing/invoices">
          <StatCard
            tone="primary"
            title="Invoices Today"
            value={`$${stats.invoicesTodayAmount?.toFixed(2) || "0.00"}`}
            subtext={`${stats.invoicesTodayCount} invoice(s) generated`}
            icon={<InvoicesIcon className="w-4 h-4" />}
          />
        </Link>

        {/* Payments Today */}
        <Link href="/billing/payments">
          <StatCard
            tone="success"
            title="Payments Settled"
            value={`$${stats.paymentsTodayAmount?.toFixed(2) || "0.00"}`}
            subtext={`${stats.paymentsTodayCount} transaction(s) today`}
            icon={<PaymentsIcon className="w-4 h-4" />}
          />
        </Link>

        {/* Outstanding Balances */}
        <Link href="/billing/outstanding">
          <StatCard
            tone="warning"
            title="Outstanding Balance"
            value={`$${stats.totalOutstandingAmount?.toFixed(2) || "0.00"}`}
            subtext={`${stats.outstandingCount} unsettled invoices`}
            icon={<OutstandingIcon className="w-4 h-4" />}
          />
        </Link>

        {/* Pending Payments */}
        <Link href="/billing/invoices?status=pending">
          <StatCard
            tone="danger"
            title="Pending Receivables"
            value={stats.pendingPaymentsCount}
            subtext={`${stats.overdueCount} account(s) overdue`}
            icon={<InvoicesIcon className="w-4 h-4" />}
          />
        </Link>
      </div>

      {/* TWO COLUMN GRID: Recent Invoices & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Recent Invoices */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Invoices Issued</h2>
            </div>
            <Link
              href="/billing/invoices"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
            >
              View All Invoices →
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No recent invoices recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map((inv: any) => (
                <Link
                  key={inv._id}
                  href={`/billing/invoices/${inv._id}`}
                  className="block p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {inv.invoiceNumber}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {inv.patientId?.name || "Patient"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium">
                        MRN: {inv.patientId?.mrn} • {new Date(inv.date || inv.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-900">
                        ${inv.totalAmount?.toFixed(2)}
                      </span>
                      <div className="mt-0.5">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            inv.status === "paid"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : inv.status === "partially_paid"
                              ? "bg-sky-50 text-sky-800 border border-sky-200"
                              : inv.status === "overdue"
                              ? "bg-rose-50 text-rose-800 border border-rose-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {inv.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {inv.balanceAmount > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Remaining Balance:</span>
                      <span className="font-bold text-amber-800 font-mono">
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Recent Payments Collected</h2>
            </div>
            <Link
              href="/billing/payments"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
            >
              All Payments →
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No payments collected yet today.
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((p: any) => (
                <Link
                  key={p._id}
                  href={`/billing/payments/${p._id}`}
                  className="block p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {p.transactionNumber}
                        </span>
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {p.patientId?.name || "Patient"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 capitalize font-medium">
                        Method: {p.paymentMethod.replace("_", " ")} • Ref: {p.referenceNumber || "Direct"}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-700 font-mono">
                        +${p.amount?.toFixed(2)}
                      </span>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">
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
    </div>
  );
}
