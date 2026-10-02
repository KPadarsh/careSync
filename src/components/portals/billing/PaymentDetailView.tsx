"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PrinterIcon,
  CheckCircleIcon,
  CreditCardIcon,
  InvoicesIcon,
} from "./BillingIcons";

interface PaymentDetailViewProps {
  id: string;
}

export function PaymentDetailView({ id }: PaymentDetailViewProps) {
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    async function fetchPayment() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/billing/payments/${id}`);
        if (!res.ok) throw new Error("Failed to load payment transaction details");
        const data = await res.json();
        setPayment(data.payment);
      } catch (err: any) {
        setError(err.message || "Failed to load payment");
      } finally {
        setLoading(false);
      }
    }
    fetchPayment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700">
        <p className="font-semibold">{error || "Payment not found"}</p>
        <Link
          href="/billing/payments"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Payments</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/billing/payments"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Payments Ledger</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-colors"
          >
            <PrinterIcon className="w-4 h-4 text-emerald-600" />
            <span>Print Cashier Receipt</span>
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            {payment.status}
          </span>
        </div>
      </div>

      {/* Main Payment Receipt Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              OFFICIAL CASHIER PAYMENT RECEIPT
            </span>
            <h1 className="text-2xl font-mono font-extrabold text-slate-900 mt-1">
              {payment.transactionNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Processed by {payment.receivedByName}
            </p>
          </div>

          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-200 text-left sm:text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Amount Settled
            </span>
            <span className="text-3xl font-extrabold font-mono text-emerald-600">
              ${payment.amount?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Transaction Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Patient</span>
            <div className="text-sm font-bold text-slate-900">{payment.patientId?.name}</div>
            <div className="text-slate-500 font-mono">MRN: {payment.patientId?.mrn}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Associated Invoice</span>
            <div className="text-sm font-mono font-bold text-blue-600">
              {payment.invoiceId?.invoiceNumber}
            </div>
            <Link
              href={`/billing/invoices/${payment.invoiceId?._id}`}
              className="text-xs text-blue-600 hover:underline inline-block font-semibold"
            >
              View Full Statement →
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Payment Method</span>
            <div className="text-sm font-bold text-slate-900 capitalize">
              {payment.paymentMethod.replace("_", " ")}
            </div>
            {payment.referenceNumber && (
              <div className="text-slate-500 font-mono text-[11px]">
                Ref / Auth: {payment.referenceNumber}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Timestamp</span>
            <div className="text-sm font-mono text-slate-700">
              {new Date(payment.paymentDate || payment.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {payment.notes && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="font-semibold text-slate-500 block mb-1">Cashier Notes:</span>
            <p className="text-slate-700">{payment.notes}</p>
          </div>
        )}
      </div>

      {/* RECEIPT PRINT PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <PrinterIcon className="w-5 h-5" />
                <span>Thermal Cashier Receipt</span>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 text-slate-900 font-mono text-xs space-y-2 border border-slate-300">
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <p className="font-bold text-sm">CARESYNC HEALTHCARE</p>
                <p className="text-[10px] text-slate-500">CASHIER RECEIPT</p>
                <p className="text-[10px] text-slate-500">{new Date().toLocaleString()}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <p>TXN: {payment.transactionNumber}</p>
                <p>INV: {payment.invoiceId?.invoiceNumber}</p>
                <p>PATIENT: {payment.patientId?.name}</p>
                <p>MRN: {payment.patientId?.mrn}</p>
                <p>METHOD: {payment.paymentMethod.toUpperCase()}</p>
                {payment.referenceNumber && <p>REF: {payment.referenceNumber}</p>}
              </div>

              <div className="border-t border-b border-dashed border-slate-400 py-2 flex justify-between font-bold text-sm">
                <span>TOTAL PAID:</span>
                <span>${payment.amount.toFixed(2)}</span>
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-1">
                <p>Processed by {payment.receivedByName}</p>
                <p className="font-semibold text-slate-700">THANK YOU FOR YOUR PAYMENT</p>
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
                  alert("Receipt successfully sent to thermal printer.");
                  setShowPrintModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
