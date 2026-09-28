"use client";

import React, { useState, useEffect } from "react";
import { SettingsIcon, CheckCircleIcon } from "./PathologistIcons";

export function SettingsView() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/pathologist/settings");
        if (res.ok) {
          const json = await res.json();
          setSettings(json.settings);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings()
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/pathologist/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex-1 p-10 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-6 max-w-5xl mx-auto w-full">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002444] tracking-tight">
          Pathology Workstation Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Configure panic value alert thresholds, digital signature stamp formatting, and auto-notification triggers.
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
          <span>Workstation preferences saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Critical Panic Value Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                High-Sensitivity Troponin Panic Level
              </label>
              <input
                type="text"
                value={settings.criticalAlertThresholds?.troponinPanicLevel || "0.04 ng/mL"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    criticalAlertThresholds: {
                      ...settings.criticalAlertThresholds,
                      troponinPanicLevel: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Serum Potassium Critical High Limit
              </label>
              <input
                type="text"
                value={settings.criticalAlertThresholds?.potassiumHighPanic || "6.0 mEq/L"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    criticalAlertThresholds: {
                      ...settings.criticalAlertThresholds,
                      potassiumHighPanic: e.target.value,
                    },
                  })
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase">Automation &amp; Dispatch</h3>
            <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoNotifyOrderingDoctor}
                onChange={(e) =>
                  setSettings({ ...settings, autoNotifyOrderingDoctor: e.target.checked })
                }
                className="w-4 h-4 rounded text-[#00355f]"
              />
              <span>Instantly notify ordering physician upon pathology report certification</span>
            </label>

            <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifyPatientOnVerification}
                onChange={(e) =>
                  setSettings({ ...settings, notifyPatientOnVerification: e.target.checked })
                }
                className="w-4 h-4 rounded text-[#00355f]"
              />
              <span>Release finalized report to patient portal upon certification</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#00355f] hover:bg-[#002444] text-white text-xs font-bold shadow-sm"
          >
            Save Workstation Settings
          </button>
        </div>
      </form>
    </div>
  );
}
