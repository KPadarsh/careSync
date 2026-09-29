"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PrinterIcon,
  CreditCardIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CurrencyDollarIcon,
  PaymentsIcon,
} from "./BillingIcons";

interface InvoiceDetailViewProps {
  id: string;
}

export function InvoiceDetailView({ id }: InvoiceDetailViewProps) {
  const [invoice, setInvoice] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment Collection Modal States
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("credit_card");
  const [payRef, setPayRef] = useState("");
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");

  // Print Statement Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/billing/invoices/${id}`);
      if (!res.ok) throw new Error("Failed to load invoice details");
      const data = await res.json();
      setInvoice(data.invoice);
      setPayments(data.payments || []);
      if (data.invoice) {
        setPayAmount(data.invoice.balanceAmount || 0);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayError("");

    if (payAmount <= 0) {
      setPayError("Payment amount must be greater than zero.");
      return;
    }

    if (payAmount > (invoice?.balanceAmount || 0) + 0.001) {
      setPayError(`Payment cannot exceed outstanding balance of $${invoice.balanceAmount.toFixed(2)}.`);
      return;
    }

    setPayLoading(true);
    try {
      const res = await fetch("/api/billing/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice._id,
          amount: payAmount,
          paymentMethod: payMethod,
          referenceNumber: payRef,
          paymentDate: payDate,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment recording failed");

      setShowPayModal(false);
      setPayRef("");
      setPayNotes("");
      await fetchInvoice();
    } catch (err: any) {
      setPayError(err.message || "Failed to process payment");
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Patient Invoice Statement...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <p className="font-semibold">{error || "Invoice not found"}</p>
        <Link
          href="/billing/invoices"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/billing/invoices"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Invoices Queue</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <PrinterIcon className="w-4 h-4 text-blue-400" />
            <span>Print Statement</span>
          </button>

          {invoice.balanceAmount > 0 && (
            <button
              onClick={() => {
                setPayAmount(invoice.balanceAmount);
                setShowPayModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all hover:scale-102"
            >
              <CreditCardIcon className="w-4 h-4" />
              <span>Collect Payment</span>
            </button>
          )}

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              invoice.status === "paid"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : invoice.status === "partially_paid"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : invoice.status === "overdue"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {invoice.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Main Statement Card */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-950/20">
        {/* Banner with Invoice Number & Dates */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/70 pb-6">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              PATIENT BILLING STATEMENT
            </span>
            <h1 className="text-2xl font-mono font-extrabold text-white mt-1">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Issued by {invoice.createdByName}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#08101E] px-5 py-3 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Issue Date
              </span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {new Date(invoice.date || invoice.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Due Date
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  invoice.status === "overdue" ? "text-rose-400" : "text-slate-200"
                }`}
              >
                {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Patient and Physician Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Patient Account Details
            </span>
            <div className="text-base font-bold text-white">
              {invoice.patientId?.name || "Patient"}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              MRN: {invoice.patientId?.mrn} • Phone: {invoice.patientId?.phone || "N/A"}
            </div>
            {invoice.patientId?.insurance && (
              <div className="text-xs text-blue-300 pt-1">
                Insurance: {invoice.patientId?.insurance.provider} (Policy: {invoice.patientId?.insurance.policyNumber})
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Clinical Department Reference
            </span>
            <div className="text-base font-bold text-white">
              {invoice.doctorId?.name ? `Dr. ${invoice.doctorId.name}` : "General Clinical Hospital Services"}
            </div>
            <div className="text-xs text-slate-400">
              {invoice.doctorId?.specialty || invoice.doctorId?.department || "Outpatient Facility Services"}
            </div>
            {invoice.notes && (
              <div className="text-[11px] text-slate-300 italic pt-1">
                "{invoice.notes}"
              </div>
            )}
          </div>
        </div>

        {/* Itemized Services Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Itemized Clinical Services & Medication Formulary
          </h2>

          <div className="border border-slate-800/80 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08101E] text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {invoice.services?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-white">
                      <div>{item.serviceName}</div>
                      {item.notes && (
                        <div className="text-[10px] text-slate-400 italic">{item.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 capitalize">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-300">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      ${Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      ${(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row justify-end">
          <div className="w-full sm:w-80 bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Services Subtotal:</span>
              <span className="font-mono text-white">${invoice.subtotalAmount?.toFixed(2)}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Courtesy Discount:</span>
                <span className="font-mono text-emerald-400">-${invoice.discountAmount?.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-300 font-bold border-t border-slate-800 pt-2">
              <span>Invoice Total:</span>
              <span className="font-mono text-white">${invoice.totalAmount?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-400">
              <span>Amount Paid:</span>
              <span className="font-mono text-emerald-400">${invoice.paidAmount?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm font-extrabold border-t border-slate-800 pt-2">
              <span className="text-white">Outstanding Balance:</span>
              <span
                className={`font-mono ${
                  invoice.balanceAmount === 0
                    ? "text-emerald-400"
                    : invoice.status === "overdue"
                    ? "text-rose-400"
                    : "text-amber-400"
                }`}
              >
                ${invoice.balanceAmount?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History For This Invoice */}
        <div className="space-y-3 pt-4 border-t border-slate-800/70">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Payments Collected Against This Invoice
            </h2>
            <span className="text-xs text-slate-400">
              {payments.length} transaction{payments.length === 1 ? "" : "s"}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
              No payments collected yet for this invoice.
            </div>
          ) : (
            <div className="border border-slate-800/80 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#08101E] text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Txn #</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Reference / Auth</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">
                        {p.transactionNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-300 capitalize">
                        {p.paymentMethod.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {p.referenceNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono">
                        {new Date(p.paymentDate || p.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                        +${p.amount?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* COLLECT PAYMENT MODAL */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1324] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CreditCardIcon className="w-5 h-5" />
                <span>Collect Invoice Payment</span>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Outstanding Balance:</span>
              <span className="font-mono font-bold text-amber-400 text-sm">
                ${invoice.balanceAmount.toFixed(2)}
              </span>
            </div>

            {payError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {payError}
              </div>
            )}

            <form onSubmit={handleCollectPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Payment Amount ($) <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={invoice.balanceAmount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Payment Method <span className="text-emerald-400">*</span>
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="credit_card">Credit Card (Visa / Mastercard / Amex)</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="cash">Cash Tendered</option>
                  <option value="insurance">Insurance Claim Adjudication</option>
                  <option value="upi">UPI / Instant Digital Payment</option>
                  <option value="bank_transfer">Bank Wire Transfer</option>
                  <option value="cheque">Personal / Cashier Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Reference / Transaction / Auth #
                </label>
                <input
                  type="text"
                  placeholder="e.g. AUTH-48201 / Claim ID"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Receipt Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Terminal notes or receipt copy reference..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md"
                >
                  {payLoading ? "Processing..." : `Confirm Payment of $${payAmount.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT STATEMENT MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1324] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <PrinterIcon className="w-5 h-5" />
                <span>Print Statement Preview</span>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Paper statement styling */}
            <div className="p-6 rounded-xl bg-white text-black font-sans space-y-4 border-2 border-black text-xs">
              <div className="flex justify-between items-start border-b-2 border-black pb-3">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-tight">CARESYNC HEALTHCARE</h3>
                  <p className="text-[10px]">Patient Accounts & Financial Services</p>
                  <p className="text-[10px]">742 Evergreen Health Blvd • Tel: (555) 019-4820</p>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-sm">{invoice.invoiceNumber}</p>
                  <p className="text-[10px]">Date: {new Date(invoice.date || invoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p><strong>Patient:</strong> {invoice.patientId?.name} (MRN: {invoice.patientId?.mrn})</p>
                <p><strong>Status:</strong> {invoice.status.toUpperCase()}</p>
              </div>

              <div className="border-t border-b border-black py-2 space-y-1">
                {invoice.services?.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{s.quantity}x {s.serviceName}</span>
                    <span className="font-mono">${(s.quantity * s.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right">
                <p>Total Amount: <strong>${invoice.totalAmount.toFixed(2)}</strong></p>
                <p>Paid to Date: <strong>${invoice.paidAmount.toFixed(2)}</strong></p>
                <p className="text-sm font-bold border-t border-black pt-1">
                  Balance Due: ${invoice.balanceAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Statement transmitted to thermal cashier printer.");
                  setShowPrintModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Print Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
