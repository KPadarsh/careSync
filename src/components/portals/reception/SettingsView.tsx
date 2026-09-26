"use client";

import React, { useState, useEffect } from "react";
import { Icons } from "./ReceptionIcons";

interface SettingsData {
  soundNotifications: boolean;
  defaultLanding: string;
  autoRefreshInterval: number;
  printWristbandsOnCheckin: boolean;
  stationName: string;
  defaultDepartment: string;
  highContrastQueue: boolean;
  alertVolume: number;
}

export function SettingsView() {
  const [settings, setSettings] = useState<SettingsData>({
    soundNotifications: true,
    defaultLanding: "/reception/dashboard",
    autoRefreshInterval: 30,
    printWristbandsOnCheckin: true,
    stationName: "Station 01 — Main Entrance Lobby",
    defaultDepartment: "All Departments",
    highContrastQueue: false,
    alertVolume: 80,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch("/api/reception/settings");
        if (res.ok) {
          const json = await res.json();
          if (json.settings) setSettings(json.settings);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await fetch("/api/reception/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {
      alert("Failed to save terminal settings.");
    } finally {
      setSaving(false);
    }
  };

  const playTestChime = () => {
    if (typeof window !== "undefined") {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch {
        // audio context not available
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
          Workstation Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Terminal preferences, alert chimes, and reception workflow automation
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
          <Icons.CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-semibold">Workstation configuration saved successfully.</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* WORKSTATION IDENTITY */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Terminal Identification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Terminal Desk Name</label>
              <input
                type="text"
                value={settings.stationName}
                onChange={(e) => setSettings({ ...settings, stationName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Default Landing View</label>
              <select
                value={settings.defaultLanding}
                onChange={(e) => setSettings({ ...settings, defaultLanding: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value="/reception/dashboard">Reception Dashboard</option>
                <option value="/reception/queue">Live Queue Lounge Board</option>
                <option value="/reception/appointments">Appointments Directory</option>
                <option value="/reception/walk-ins">Rapid Walk-in Intake</option>
              </select>
            </div>
          </div>
        </div>

        {/* WORKFLOW AUTOMATION & REFRESH */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Queue &amp; Hardware Preferences
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Auto-refresh Lounge Queue</p>
                <p className="text-[11px] text-slate-500">
                  Frequency for automatically polling live patient waiting updates
                </p>
              </div>
              <select
                value={settings.autoRefreshInterval}
                onChange={(e) =>
                  setSettings({ ...settings, autoRefreshInterval: Number(e.target.value) })
                }
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
              >
                <option value={15}>Every 15 Seconds</option>
                <option value={30}>Every 30 Seconds</option>
                <option value={60}>Every 1 Minute</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Auto-Print Token Slip on Check-in</p>
                <p className="text-[11px] text-slate-500">
                  Automatically triggers browser receipt printing upon generating a queue ticket
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.printWristbandsOnCheckin}
                onChange={(e) =>
                  setSettings({ ...settings, printWristbandsOnCheckin: e.target.checked })
                }
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div>
                <p className="font-semibold text-slate-800">Audio Chimes on Urgent Patient Arrival</p>
                <p className="text-[11px] text-slate-500">
                  Plays terminal chime when high-priority or walk-in arrives
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={playTestChime}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
                >
                  Test Sound
                </button>
                <input
                  type="checkbox"
                  checked={settings.soundNotifications}
                  onChange={(e) =>
                    setSettings({ ...settings, soundNotifications: e.target.checked })
                  }
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icons.Check className="w-4 h-4" />
                <span>Save Workstation Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
