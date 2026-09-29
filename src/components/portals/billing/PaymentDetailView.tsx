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
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <p className="font-semibold">{error || "Payment not found"}</p>
        <Link
          href="/billing/payments"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
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
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Payments Ledger</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <PrinterIcon className="w-4 h-4 text-emerald-400" />
            <span>Print Cashier Receipt</span>
          </button>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {payment.status}
          </span>
        </div>
      </div>

      {/* Main Payment Receipt Card */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/70 pb-6">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              OFFICIAL CASHIER PAYMENT RECEIPT
            </span>
            <h1 className="text-2xl font-mono font-extrabold text-white mt-1">
              {payment.transactionNumber}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Processed by {payment.receivedByName}
            </p>
          </div>

          <div className="bg-[#08101E] px-6 py-3 rounded-2xl border border-slate-800/80 text-left sm:text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Amount Settled
            </span>
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              ${payment.amount?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Transaction Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Patient</span>
            <div className="text-sm font-bold text-white">{payment.patientId?.name}</div>
            <div className="text-slate-400 font-mono">MRN: {payment.patientId?.mrn}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Associated Invoice</span>
            <div className="text-sm font-mono font-bold text-blue-400">
              {payment.invoiceId?.invoiceNumber}
            </div>
            <Link
              href={`/billing/invoices/${payment.invoiceId?._id}`}
              className="text-xs text-blue-300 hover:underline inline-block"
            >
              View Full Statement →
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Payment Method</span>
            <div className="text-sm font-bold text-white capitalize">
              {payment.paymentMethod.replace("_", " ")}
            </div>
            {payment.referenceNumber && (
              <div className="text-slate-400 font-mono text-[11px]">
                Ref / Auth: {payment.referenceNumber}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400">Timestamp</span>
            <div className="text-sm font-mono text-slate-200">
              {new Date(payment.paymentDate || payment.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {payment.notes && (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-400 block mb-1">Cashier Notes:</span>
            <p className="text-slate-300">{payment.notes}</p>
          </div>
        )}
      </div>

      {/* RECEIPT PRINT PREVIEW MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1324] border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <PrinterIcon className="w-5 h-5" />
                <span>Thermal Cashier Receipt</span>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-5 rounded-xl bg-white text-black font-mono text-xs space-y-2 border-2 border-black">
              <div className="text-center border-b border-dashed border-black pb-2">
                <p className="font-bold text-sm">CARESYNC HEALTHCARE</p>
                <p className="text-[10px]">CASHIER RECEIPT</p>
                <p className="text-[10px]">{new Date().toLocaleString()}</p>
              </div>

              <div className="space-y-1 text-[11px]">
                <p>TXN: {payment.transactionNumber}</p>
                <p>INV: {payment.invoiceId?.invoiceNumber}</p>
                <p>PATIENT: {payment.patientId?.name}</p>
                <p>MRN: {payment.patientId?.mrn}</p>
                <p>METHOD: {payment.paymentMethod.toUpperCase()}</p>
                {payment.referenceNumber && <p>REF: {payment.referenceNumber}</p>}
              </div>

              <div className="border-t border-b border-dashed border-black py-2 flex justify-between font-bold text-sm">
                <span>TOTAL PAID:</span>
                <span>${payment.amount.toFixed(2)}</span>
              </div>

              <div className="text-center text-[10px] pt-1">
                <p>Processed by {payment.receivedByName}</p>
                <p>THANK YOU FOR YOUR PAYMENT</p>
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
                  alert("Receipt successfully sent to thermal printer.");
                  setShowPrintModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
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
