"use client";

import React, { useState } from "react";
import {
  SettingsIcon,
  CheckCircle2Icon,
  PrinterIcon,
  DollarSignIcon,
  BuildingIcon,
  ShieldIcon,
} from "./BillingShell";

export function SettingsView() {
  const [settings, setSettings] = useState({
    cashierDeskName: "Ground Floor Cash Desk 1",
    hospitalTaxId: "TX-CARE-98442-B",
    defaultPaymentMethod: "credit_card",
    currency: "USD ($)",
    autoPrintReceipt: true,
    receiptFooterMessage: "Thank you for choosing CareSync Medical Center. For billing inquiries, call ext 4421.",
    overdueGraceDays: 14,
    enableUpiQRCodes: true,
    requireTransactionReference: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Cashier Desk & Billing Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure register defaults, receipt layout, and point-of-sale operational policies
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm">
            <CheckCircle2Icon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>Billing desk preferences saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cashier Station Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <BuildingIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Station Identification</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Cashier Desk Name
                </label>
                <input
                  type="text"
                  value={settings.cashierDeskName}
                  onChange={(e) => setSettings({ ...settings, cashierDeskName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Hospital Billing Tax ID
                </label>
                <input
                  type="text"
                  value={settings.hospitalTaxId}
                  onChange={(e) => setSettings({ ...settings, hospitalTaxId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Handling Defaults */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <DollarSignIcon className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-slate-900">Payment Collection Defaults</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Default Payment Method
                </label>
                <select
                  value={settings.defaultPaymentMethod}
                  onChange={(e) => setSettings({ ...settings, defaultPaymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="upi">UPI / Instant Pay</option>
                  <option value="insurance">Insurance Claim</option>
                  <option value="bank_transfer">Direct Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Overdue Grace Period (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={settings.overdueGraceDays}
                  onChange={(e) =>
                    setSettings({ ...settings, overdueGraceDays: parseInt(e.target.value) || 14 })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoPrintReceipt}
                  onChange={(e) => setSettings({ ...settings, autoPrintReceipt: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Automatically prompt receipt print dialog upon confirming payment collection
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.requireTransactionReference}
                  onChange={(e) =>
                    setSettings({ ...settings, requireTransactionReference: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Require transaction reference / card approval code for digital payments
                </span>
              </label>
            </div>
          </div>

          {/* Receipt Customization */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <PrinterIcon className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">Receipt Notes & Disclaimer</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Receipt Footer Text
              </label>
              <textarea
                rows={3}
                value={settings.receiptFooterMessage}
                onChange={(e) => setSettings({ ...settings, receiptFooterMessage: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Appears at the bottom of printed invoices and cashier transaction receipts.
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
  );
}
