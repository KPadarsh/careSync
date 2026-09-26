"use client";

import React, { useState, useEffect } from "react";
import {
  IconSettings,
  IconCheckCircle,
  IconFlask,
  IconBarcode,
  IconAlertTriangle,
} from "./LabIcons";

export function SettingsView() {
  const [settings, setSettings] = useState({
    autoSyncAnalyzer: true,
    barcodePrefix: "BC-SMP-2026-",
    defaultTubeVolume: "4.0 mL",
    autoAdvanceToProcessing: false,
    statAudioAlerts: true,
    highlightCriticalValues: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/lab/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg(false);
    try {
      const res = await fetch("/api/lab/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      } else {
        alert("Failed to save settings");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading laboratory preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laboratory Station Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure diagnostic station parameters, barcode formatting, and analyzer integration flags.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-medium animate-fade-in shadow-sm">
          <IconCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Settings saved successfully. Station configuration updated.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Analyzer & Automation */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <IconFlask className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Analyzer & Automation Interface</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSyncAnalyzer}
                onChange={(e) => setSettings({ ...settings, autoSyncAnalyzer: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#004ac6] focus:ring-[#004ac6]"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Auto-sync with Diagnostic Analyzers</span>
                <p className="text-xs text-slate-500">
                  Automatically pull calibrated raw parameter readings from connected clinical chemistry and hematology instruments.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoAdvanceToProcessing}
                onChange={(e) => setSettings({ ...settings, autoAdvanceToProcessing: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#004ac6] focus:ring-[#004ac6]"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Auto-advance to Processing State</span>
                <p className="text-xs text-slate-500">
                  Immediately flag sample status as Processing upon vacutainer barcode scan at the station.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Specimen Barcode & Storage */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <IconBarcode className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">Specimen & Barcode Standards</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Barcode Token Prefix</label>
              <input
                type="text"
                value={settings.barcodePrefix}
                onChange={(e) => setSettings({ ...settings, barcodePrefix: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Tokens must not contain sensitive patient information.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Default Specimen Volume</label>
              <input
                type="text"
                value={settings.defaultTubeVolume}
                onChange={(e) => setSettings({ ...settings, defaultTubeVolume: e.target.value })}
                placeholder="4.0 mL"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Alerts & Critical Flags */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <IconAlertTriangle className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-900">STAT Alerts & Panic Values</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.statAudioAlerts}
                onChange={(e) => setSettings({ ...settings, statAudioAlerts: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#004ac6] focus:ring-[#004ac6]"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Audible Chime for STAT Orders</span>
                <p className="text-xs text-slate-500">
                  Emit immediate notification beep on bench terminal when emergency department or ICU orders a STAT test.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.highlightCriticalValues}
                onChange={(e) => setSettings({ ...settings, highlightCriticalValues: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#004ac6] focus:ring-[#004ac6]"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">Auto-Highlight Panic / Critical Values</span>
                <p className="text-xs text-slate-500">
                  Highlight test parameters in red with urgent warning indicator when values exceed critical physiological thresholds.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#004ac6] hover:bg-blue-700 rounded-xl transition-all shadow-md disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
