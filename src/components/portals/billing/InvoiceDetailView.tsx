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
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading Patient Invoice Statement...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700">
        <p className="font-semibold">{error || "Invoice not found"}</p>
        <Link
          href="/billing/invoices"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs"
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Invoices Queue</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors"
          >
            <PrinterIcon className="w-4 h-4 text-blue-600" />
            <span>Print Statement</span>
          </button>

          {invoice.balanceAmount > 0 && (
            <button
              onClick={() => {
                setPayAmount(invoice.balanceAmount);
                setShowPayModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <CreditCardIcon className="w-4 h-4" />
              <span>Collect Payment</span>
            </button>
          )}

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              invoice.status === "paid"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : invoice.status === "partially_paid"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : invoice.status === "overdue"
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {invoice.status.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Main Statement Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        {/* Banner with Invoice Number & Dates */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              PATIENT BILLING STATEMENT
            </span>
            <h1 className="text-2xl font-mono font-extrabold text-slate-900 mt-1">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Issued by {invoice.createdByName}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 px-5 py-3 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Issue Date
              </span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {new Date(invoice.date || invoice.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                Due Date
              </span>
              <span
                className={`text-xs font-mono font-bold ${
                  invoice.status === "overdue" ? "text-rose-600" : "text-slate-800"
                }`}
              >
                {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Patient and Physician Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Patient Account Details
            </span>
            <div className="text-base font-bold text-slate-900">
              {invoice.patientId?.name || "Patient"}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              MRN: {invoice.patientId?.mrn} • Phone: {invoice.patientId?.phone || "N/A"}
            </div>
            {invoice.patientId?.insurance && (
              <div className="text-xs text-blue-700 pt-1 font-medium">
                Insurance: {invoice.patientId?.insurance.provider} (Policy: {invoice.patientId?.insurance.policyNumber})
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Clinical Department Reference
            </span>
            <div className="text-base font-bold text-slate-900">
              {invoice.doctorId?.name ? `Dr. ${invoice.doctorId.name}` : "General Clinical Hospital Services"}
            </div>
            <div className="text-xs text-slate-500">
              {invoice.doctorId?.specialty || invoice.doctorId?.department || "Outpatient Facility Services"}
            </div>
            {invoice.notes && (
              <div className="text-[11px] text-slate-600 italic pt-1">
                &ldquo;{invoice.notes}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Itemized Services Table */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Itemized Clinical Services &amp; Medication Formulary
          </h2>

          <div className="border border-slate-200/80 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {invoice.services?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div>{item.serviceName}</div>
                      {item.notes && (
                        <div className="text-[10px] text-slate-500 italic">{item.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 capitalize">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      ${Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
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
          <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Services Subtotal:</span>
              <span className="font-mono text-slate-900">${invoice.subtotalAmount?.toFixed(2)}</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Courtesy Discount:</span>
                <span className="font-mono text-emerald-600">-${invoice.discountAmount?.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-700 font-bold border-t border-slate-200 pt-2">
              <span>Invoice Total:</span>
              <span className="font-mono text-slate-900">${invoice.totalAmount?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Amount Paid:</span>
              <span className="font-mono text-emerald-600">${invoice.paidAmount?.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-sm font-extrabold border-t border-slate-200 pt-2">
              <span className="text-slate-900">Outstanding Balance:</span>
              <span
                className={`font-mono ${
                  invoice.balanceAmount === 0
                    ? "text-emerald-600"
                    : invoice.status === "overdue"
                    ? "text-rose-600"
                    : "text-amber-600"
                }`}
              >
                ${invoice.balanceAmount?.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment History For This Invoice */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Payments Collected Against This Invoice
            </h2>
            <span className="text-xs text-slate-500">
              {payments.length} transaction{payments.length === 1 ? "" : "s"}
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
              No payments collected yet for this invoice.
            </div>
          ) : (
            <div className="border border-slate-200/80 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Txn #</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Reference / Auth</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">
                        {p.transactionNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-700 capitalize">
                        {p.paymentMethod.replace("_", " ")}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {p.referenceNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {new Date(p.paymentDate || p.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CreditCardIcon className="w-5 h-5" />
                <span>Collect Invoice Payment</span>
              </div>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Outstanding Balance:</span>
              <span className="font-mono font-bold text-amber-600 text-sm">
                ${invoice.balanceAmount.toFixed(2)}
              </span>
            </div>

            {payError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {payError}
              </div>
            )}

            <form onSubmit={handleCollectPayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Amount ($) <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={invoice.balanceAmount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Method <span className="text-emerald-600">*</span>
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
                <label className="block text-slate-700 font-semibold mb-1">
                  Reference / Transaction / Auth #
                </label>
                <input
                  type="text"
                  placeholder="e.g. AUTH-48201 / Claim ID"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Receipt Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Terminal notes or receipt copy reference..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <PrinterIcon className="w-5 h-5" />
                <span>Print Statement Preview</span>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {/* Paper statement styling */}
            <div className="p-6 rounded-xl bg-slate-50 text-slate-900 font-sans space-y-4 border border-slate-300 text-xs">
              <div className="flex justify-between items-start border-b border-slate-300 pb-3">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-tight text-slate-900">CARESYNC HEALTHCARE</h3>
                  <p className="text-[10px] text-slate-500">Patient Accounts &amp; Financial Services</p>
                  <p className="text-[10px] text-slate-500">742 Evergreen Health Blvd • Tel: (555) 019-4820</p>
                </div>
                <div className="text-right font-mono">
                  <p className="font-bold text-sm text-slate-900">{invoice.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-500">Date: {new Date(invoice.date || invoice.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <p><strong>Patient:</strong> {invoice.patientId?.name} (MRN: {invoice.patientId?.mrn})</p>
                <p><strong>Status:</strong> {invoice.status.toUpperCase()}</p>
              </div>

              <div className="border-t border-b border-slate-300 py-2 space-y-1">
                {invoice.services?.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{s.quantity}x {s.serviceName}</span>
                    <span className="font-mono font-medium">${(s.quantity * s.unitPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right">
                <p>Total Amount: <strong>${invoice.totalAmount.toFixed(2)}</strong></p>
                <p>Paid to Date: <strong>${invoice.paidAmount.toFixed(2)}</strong></p>
                <p className="text-sm font-bold border-t border-slate-300 pt-1 text-slate-900">
                  Balance Due: ${invoice.balanceAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Statement transmitted to thermal cashier printer.");
                  setShowPrintModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
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
