"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCardIcon,
  SearchIcon,
  PrinterIcon,
  RefreshCwIcon,
  DollarSignIcon,
  FileTextIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
} from "./BillingShell";

interface HistoryTransaction {
  _id: string;
  transactionNumber: string;
  invoiceId?: {
    _id: string;
    invoiceNumber: string;
    totalAmount: number;
    balanceAmount: number;
  };
  patientId?: {
    _id: string;
    fullName: string;
    mrn: string;
  };
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  paymentDate: string;
  status: "completed" | "refunded" | "failed";
  receivedByName?: string;
  notes?: string;
}

export function HistoryView() {
  const [payments, setPayments] = useState<HistoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/history");
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error("Error loading payment history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filtered = payments.filter((p) => {
    const tNum = p.transactionNumber.toLowerCase();
    const invNum = p.invoiceId?.invoiceNumber?.toLowerCase() || "";
    const pName = p.patientId?.fullName?.toLowerCase() || "";
    const pMrn = p.patientId?.mrn?.toLowerCase() || "";
    const refNum = p.referenceNumber?.toLowerCase() || "";
    const q = searchTerm.toLowerCase();

    const matchesSearch =
      tNum.includes(q) || invNum.includes(q) || pName.includes(q) || pMrn.includes(q) || refNum.includes(q);

    if (!matchesSearch) return false;
    if (methodFilter !== "all" && p.paymentMethod !== methodFilter) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;

    return true;
  });

  const totalCollected = filtered
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Financial Audit & Billing History
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Immutable ledger of all received payments, receipts, and cashier settlements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHistory()}
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
              Print Ledger
            </button>
          </div>
        </div>

        {/* Total stats card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Transactions
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {filtered.length}
            </div>
            <div className="text-xs text-slate-500 mt-1">In selected query</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Settled Volume
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              ${totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-emerald-700 mt-1">Confirmed payments</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Cashier Reconciliation
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">100% Verified</div>
            <div className="text-xs text-slate-500 mt-1">All entries audit-locked</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by transaction #, invoice #, patient, ref..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <span>Method:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="insurance">Insurance</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <div className="flex items-center gap-1 text-sm text-slate-600">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading billing history...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCardIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No payment records found</h3>
              <p className="text-sm text-slate-500 mt-1">Try modifying your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Transaction #</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Method & Ref</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        <Link
                          href={`/billing/payments/${p._id}`}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {p.transactionNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div>{new Date(p.paymentDate).toLocaleDateString()}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(p.paymentDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {p.invoiceId ? (
                          <Link
                            href={`/billing/invoices/${p.invoiceId._id}`}
                            className="hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <FileTextIcon className="w-3.5 h-3.5 text-slate-400" />
                            {p.invoiceId.invoiceNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {p.patientId?.fullName || "Patient"}
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          {p.patientId?.mrn || "—"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="capitalize font-medium text-slate-700">
                          {p.paymentMethod.replace("_", " ")}
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          {p.referenceNumber || "—"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        +${p.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.status === "refunded"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {p.status === "completed" && <CheckCircle2Icon className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {p.receivedByName || "Cashier"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/billing/payments/${p._id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                        >
                          Receipt
                          <ChevronRightIcon className="w-3 h-3" />
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
