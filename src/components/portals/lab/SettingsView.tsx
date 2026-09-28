"use client";

import React, { useState, useEffect } from "react";
import {
  SettingsIcon,
  CheckIcon,
  AlertTriangleIcon,
  PrinterIcon,
  BarcodeIcon,
} from "./LabIcons";

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<any>({
    stationName: "Central Pathology Station 2",
    defaultAnalyzer: "Roche Cobas 6000 Chemistry Analyzer",
    secondaryAnalyzer: "Sysmex XN-1000 Automated Hematology",
    barcodePrinter: "Zebra ZD421 (2x1 Direct Thermal)",
    autoReferenceRanges: true,
    criticalValueHighlight: true,
    statAudibleAlerts: true,
    autoAccessionBarcode: true,
    defaultSpecimenVolume: "4.0 mL",
    sampleRetentionDays: 7,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/lab/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/lab/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage("Workstation settings updated successfully.");
      }
    } catch (err) {
      console.error("Save settings error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* HEADER SECTION */}
      <div className="pb-2 border-b border-slate-200/80">
        <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">
          Laboratory Workstation Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure diagnostic analyzer interfaces, thermal barcode printers, and critical alert preferences.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
          <CheckIcon size={16} className="text-teal-600" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* INSTRUMENT INTERFACES */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 flex flex-col gap-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-[#00355f]">Analytical Instrument Benches</h2>
            <p className="text-xs text-slate-500">Default instruments connected to Station 2.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Primary Chemistry Analyzer
              </label>
              <select
                value={settings.defaultAnalyzer}
                onChange={(e) => setSettings({ ...settings, defaultAnalyzer: e.target.value })}
                className="w-full p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              >
                <option value="Roche Cobas 6000 Chemistry Analyzer">Roche Cobas 6000 Chemistry Analyzer</option>
                <option value="Beckman Coulter AU5800">Beckman Coulter AU5800</option>
                <option value="Abbott Architect c8000">Abbott Architect c8000</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Primary Hematology Analyzer
              </label>
              <select
                value={settings.secondaryAnalyzer}
                onChange={(e) => setSettings({ ...settings, secondaryAnalyzer: e.target.value })}
                className="w-full p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              >
                <option value="Sysmex XN-1000 Automated Hematology">Sysmex XN-1000 Automated Hematology</option>
                <option value="Beckman Coulter DxH 900">Beckman Coulter DxH 900</option>
                <option value="Mindray BC-6800Plus">Mindray BC-6800Plus</option>
              </select>
            </div>
          </div>
        </div>

        {/* BARCODE & SAMPLE ACCREDITATION */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-6 flex flex-col gap-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-[#00355f]">Barcode Printer &amp; Specimen Labeling</h2>
            <p className="text-xs text-slate-500">Standardized token format (SMP-2026-XXXXX).</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Thermal Label Printer
              </label>
              <select
                value={settings.barcodePrinter}
                onChange={(e) => setSettings({ ...settings, barcodePrinter: e.target.value })}
                className="w-full p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              >
                <option value="Zebra ZD421 (2x1 Direct Thermal)">Zebra ZD421 (2x1 Direct Thermal)</option>
                <option value="Bixolon SLP-TX400">Bixolon SLP-TX400</option>
                <option value="TSC TE200 Station 2">TSC TE200 Station 2</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Specimen Archive Retention Policy
              </label>
              <select
                value={settings.sampleRetentionDays}
                onChange={(e) => setSettings({ ...settings, sampleRetentionDays: Number(e.target.value) })}
                className="w-full p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              >
                <option value={7}>7 Days (Cold 4°C Standard)</option>
                <option value={14}>14 Days (Extended Bio-archive)</option>
                <option value={30}>30 Days (Specialized Serum / DNA)</option>
              </select>
            </div>
          </div>

          {/* TOGGLES */}
          <div className="flex flex-col gap-3 pt-2 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoAccessionBarcode}
                onChange={(e) => setSettings({ ...settings, autoAccessionBarcode: e.target.checked })}
                className="w-4 h-4 text-[#00355f] rounded"
              />
              <span className="text-slate-700 font-medium">
                Automatically generate secure SMP-2026 barcode token during sample collection
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoReferenceRanges}
                onChange={(e) => setSettings({ ...settings, autoReferenceRanges: e.target.checked })}
                className="w-4 h-4 text-[#00355f] rounded"
              />
              <span className="text-slate-700 font-medium">
                Auto-populate demographic reference intervals (Age/Gender tailored)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.criticalValueHighlight}
                onChange={(e) => setSettings({ ...settings, criticalValueHighlight: e.target.checked })}
                className="w-4 h-4 text-[#00355f] rounded"
              />
              <span className="text-slate-700 font-medium">
                Highlight panic/critical laboratory values with bold alert banners
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.statAudibleAlerts}
                onChange={(e) => setSettings({ ...settings, statAudibleAlerts: e.target.checked })}
                className="w-4 h-4 text-[#00355f] rounded"
              />
              <span className="text-slate-700 font-medium">
                Enable workstation audible chime for incoming STAT doctor orders
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#00355f] hover:bg-[#0f4c81] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            {saving ? "Saving Configuration..." : "Save Workstation Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};
