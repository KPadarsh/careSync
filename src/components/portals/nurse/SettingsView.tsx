"use client";

import React, { useState, useEffect } from "react";
import { SettingsIcon, SaveIcon, CheckCircleIcon, AlertTriangleIcon } from "./NurseIcons";

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [stationName, setStationName] = useState("Triage Station 3A - Main Clinic");
  const [roomAssignment, setRoomAssignment] = useState("Room 302");
  const [autoRefreshIntervalSeconds, setAutoRefreshIntervalSeconds] = useState(30);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);

  // Thresholds
  const [systolicHigh, setSystolicHigh] = useState(140);
  const [diastolicHigh, setDiastolicHigh] = useState(90);
  const [heartRateHigh, setHeartRateHigh] = useState(100);
  const [spo2Low, setSpo2Low] = useState(94);
  const [temperatureHigh, setTemperatureHigh] = useState(100.4);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/nurse/settings");
      if (res.ok) {
        const json = await res.json();
        const s = json.settings || {};
        setSettings(s);
        setStationName(s.stationName || "Triage Station 3A - Main Clinic");
        setRoomAssignment(s.roomAssignment || "Room 302");
        setAutoRefreshIntervalSeconds(s.autoRefreshIntervalSeconds || 30);
        setAudioAlertsEnabled(s.audioAlertsEnabled ?? true);

        if (s.criticalVitalsThresholds) {
          const t = s.criticalVitalsThresholds;
          if (t.systolicHigh) setSystolicHigh(t.systolicHigh);
          if (t.diastolicHigh) setDiastolicHigh(t.diastolicHigh);
          if (t.heartRateHigh) setHeartRateHigh(t.heartRateHigh);
          if (t.spo2Low) setSpo2Low(t.spo2Low);
          if (t.temperatureHigh) setTemperatureHigh(t.temperatureHigh);
        }
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
      setSuccess(null);

      const res = await fetch("/api/nurse/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationName,
          roomAssignment,
          autoRefreshIntervalSeconds: Number(autoRefreshIntervalSeconds),
          audioAlertsEnabled,
          criticalVitalsThresholds: {
            systolicHigh: Number(systolicHigh),
            diastolicHigh: Number(diastolicHigh),
            heartRateHigh: Number(heartRateHigh),
            spo2Low: Number(spo2Low),
            temperatureHigh: Number(temperatureHigh),
          },
        }),
      });

      if (res.ok) {
        setSuccess("Workstation preferences updated successfully.");
      }
    } catch (err) {
      console.error("Settings save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006a61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Workstation Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">Workstation Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure triage station parameters, vital alert limits, and queue monitoring intervals.
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
          <CheckCircleIcon size={16} className="text-teal-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* STATION CONFIGURATION */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
            Triage Station Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Station Name</label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Room Assignment
              </label>
              <input
                type="text"
                value={roomAssignment}
                onChange={(e) => setRoomAssignment(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Live Queue Auto-Refresh
              </label>
              <select
                value={autoRefreshIntervalSeconds}
                onChange={(e) => setAutoRefreshIntervalSeconds(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-medium text-slate-800"
              >
                <option value={15}>Every 15 Seconds (Rapid)</option>
                <option value={30}>Every 30 Seconds (Default)</option>
                <option value={60}>Every 60 Seconds</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="audioAlerts"
                checked={audioAlertsEnabled}
                onChange={(e) => setAudioAlertsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <label htmlFor="audioAlerts" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Sound Chime on Urgent Patient Intake
              </label>
            </div>
          </div>
        </div>

        {/* CRITICAL VITALS THRESHOLDS */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col gap-4">
          <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangleIcon size={16} className="text-rose-600" />
            <span>Critical Vitals Trigger Limits (Clinical Alerts)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Systolic BP High Alert (&gt; mmHg)
              </label>
              <input
                type="number"
                value={systolicHigh}
                onChange={(e) => setSystolicHigh(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Diastolic BP High Alert (&gt; mmHg)
              </label>
              <input
                type="number"
                value={diastolicHigh}
                onChange={(e) => setDiastolicHigh(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Heart Rate High Alert (&gt; bpm)
              </label>
              <input
                type="number"
                value={heartRateHigh}
                onChange={(e) => setHeartRateHigh(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                SpO2 Low Alert (&lt; %)
              </label>
              <input
                type="number"
                value={spo2Low}
                onChange={(e) => setSpo2Low(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Temperature High Alert (&gt; °F)
              </label>
              <input
                type="number"
                step="0.1"
                value={temperatureHigh}
                onChange={(e) => setTemperatureHigh(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-[#00355f] hover:bg-[#0f4c81] text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5"
          >
            <SaveIcon size={14} />
            <span>{saving ? "Updating..." : "Save Preferences"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
