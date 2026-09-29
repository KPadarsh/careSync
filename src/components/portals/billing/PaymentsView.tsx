"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PaymentsIcon,
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  CreditCardIcon,
  CheckCircleIcon,
} from "./BillingIcons";

export function PaymentsView() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/billing/payments", window.location.origin);
      if (methodFilter !== "all") url.searchParams.set("method", methodFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load payment transactions");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const totalCollected = payments.reduce((acc, p) => acc + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              CASHIER TRANSACTIONS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Payments & Collections Ledger
          </h1>
          <p className="text-sm text-slate-400">
            Real-time registry of all settled payments, credit cards, insurance claims, and cash receipts.
          </p>
        </div>

        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshIcon className="w-4 h-4 text-emerald-400" />
          <span>Refresh Transactions</span>
        </button>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Total Transactions Logged
            </span>
            <div className="text-3xl font-extrabold text-white mt-1">
              {payments.length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <PaymentsIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Cumulative Amount Collected
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
              ${totalCollected.toFixed(2)}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0A1324] border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: "all", label: "All Methods" },
            { id: "credit_card", label: "Credit Card" },
            { id: "cash", label: "Cash" },
            { id: "insurance", label: "Insurance" },
            { id: "upi", label: "UPI / Digital" },
            { id: "bank_transfer", label: "Wire" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMethodFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                methodFilter === tab.id
                  ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search txn #, patient, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            <SearchIcon className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Payments Table */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            Loading payment records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No payment transactions found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08101E] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Txn #</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Invoice Reference</th>
                  <th className="px-5 py-3.5">Payment Method</th>
                  <th className="px-5 py-3.5">Auth / Ref #</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/50 text-[11px]">
                        {p.transactionNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-white group-hover:text-emerald-300 transition-colors text-sm">
                        {p.patientId?.name || "Patient"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        MRN: {p.patientId?.mrn || "MRN-0000"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {p.invoiceId ? (
                        <Link
                          href={`/billing/invoices/${p.invoiceId._id}`}
                          className="font-mono font-semibold text-blue-400 hover:underline"
                        >
                          {p.invoiceId.invoiceNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-200 capitalize font-medium">
                        {p.paymentMethod.replace("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                      {p.referenceNumber || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-300 font-mono text-[11px]">
                      {new Date(p.paymentDate || p.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    <td className="px-5 py-4 font-mono font-extrabold text-sm text-emerald-400">
                      +${p.amount?.toFixed(2)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/billing/payments/${p._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white font-semibold text-xs transition-colors"
                      >
                        <span>Receipt</span>
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
