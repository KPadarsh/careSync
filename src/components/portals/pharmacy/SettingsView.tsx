"use client";

import React, { useState, useEffect } from "react";
import {
  SettingsIcon,
  CheckCircleIcon,
  PrinterIcon,
  BellIcon,
} from "./PharmacyIcons";

export function SettingsView() {
  const [settings, setSettings] = useState<any>({
    dispensaryStation: "Counter B - Outpatient Central Pharmacy",
    autoCheckInventory: true,
    soundAlertsOnNewRx: true,
    requireBatchScan: false,
    defaultDaysSupply: 30,
    labelPrinter: "Zebra ZD421 Direct Thermal (IP 192.168.1.185)",
    lowStockEmailAlerts: true,
    lowStockAlertThresholdPercent: 20,
    autoReserveStockOnReview: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/pharmacy/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setSettings(data.settings);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/api/pharmacy/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSuccessMsg("Dispensary station preferences saved successfully.");
    } catch (err: any) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
            DISPENSARY CONFIGURATION
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Pharmacy Station Settings
        </h1>
        <p className="text-sm text-slate-400">
          Configure label printing peripherals, inventory threshold triggers, and queue alerts.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hardware & Peripherals */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <PrinterIcon className="w-5 h-5 text-teal-400" />
            <span>Hardware & Peripherals</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Dispensary Station Identifier
              </label>
              <input
                type="text"
                value={settings.dispensaryStation}
                onChange={(e) => setSettings({ ...settings, dispensaryStation: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Direct Thermal Label Printer
              </label>
              <input
                type="text"
                value={settings.labelPrinter}
                onChange={(e) => setSettings({ ...settings, labelPrinter: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Workflow & Inventory Automation */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <SettingsIcon className="w-5 h-5 text-teal-400" />
            <span>Workflow Automation</span>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-200 block">
                  Automatic Inventory Verification
                </span>
                <span className="text-[11px] text-slate-400">
                  Cross-reference real-time stock levels when opening doctor prescriptions.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoCheckInventory}
                onChange={(e) => setSettings({ ...settings, autoCheckInventory: e.target.checked })}
                className="w-4 h-4 accent-teal-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-200 block">
                  Audio & Banner Chimes for New Doctor Prescriptions
                </span>
                <span className="text-[11px] text-slate-400">
                  Play tone when a physician signs and submits an outpatient prescription.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundAlertsOnNewRx}
                onChange={(e) => setSettings({ ...settings, soundAlertsOnNewRx: e.target.checked })}
                className="w-4 h-4 accent-teal-500 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-semibold text-slate-200 block">
                  Low-Stock Automatic Email Digest
                </span>
                <span className="text-[11px] text-slate-400">
                  Alert lead pharmacist when inventory falls below critical threshold.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.lowStockEmailAlerts}
                onChange={(e) => setSettings({ ...settings, lowStockEmailAlerts: e.target.checked })}
                className="w-4 h-4 accent-teal-500 rounded"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-teal-950/40"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
