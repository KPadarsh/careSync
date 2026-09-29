"use client";

import React, { useState, useEffect } from "react";
import {
  AdminShell,
  SettingsIcon,
  CheckCircleIcon,
  ShieldIcon,
  BuildingIcon,
  ClockIcon,
  LockIcon,
} from "./AdminShell";

export function SettingsView() {
  const [settings, setSettings] = useState({
    facilityName: "CareSync Multispecialty Medical Center",
    facilityCode: "CS-MAIN-01",
    timezone: "America/New_York (EST)",
    operatingSchedule: "Monday - Sunday (24/7 Facility Support)",
    defaultShiftDurationHours: 8,
    sessionTimeoutMinutes: 60,
    enforceMfaForStaff: true,
    auditLogRetentionDays: 365,
    allowSelfRegistration: true,
    maintenanceMode: false,
  });

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error("Error loading settings:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell activeKey="settings">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            System & Infrastructure Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global healthcare facility parameters, shift duration defaults, security policies, and compliance retention.
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Administrative configuration updated and recorded in audit log.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Facility Identification */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900 text-sm">
              <BuildingIcon className="w-4 h-4 text-indigo-600" />
              Facility Identification & Timezone
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Healthcare Center Name
                </label>
                <input
                  type="text"
                  value={settings.facilityName}
                  onChange={(e) => setSettings({ ...settings, facilityName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Facility Code
                </label>
                <input
                  type="text"
                  value={settings.facilityCode}
                  onChange={(e) => setSettings({ ...settings, facilityCode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Operational Timezone
                </label>
                <input
                  type="text"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Weekly Operating Schedule
                </label>
                <input
                  type="text"
                  value={settings.operatingSchedule}
                  onChange={(e) => setSettings({ ...settings, operatingSchedule: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Shift & Scheduling Policies */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900 text-sm">
              <ClockIcon className="w-4 h-4 text-blue-600" />
              Duty Shift Duration Defaults
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Default Shift Duration (Hours)
                </label>
                <input
                  type="number"
                  min={4}
                  max={24}
                  value={settings.defaultShiftDurationHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultShiftDurationHours: parseInt(e.target.value) || 8,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Session Timeout Inactivity (Minutes)
                </label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      sessionTimeoutMinutes: parseInt(e.target.value) || 60,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Security & Access Policies */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900 text-sm">
              <ShieldIcon className="w-4 h-4 text-purple-600" />
              Security & Audit Retention Policies
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enforceMfaForStaff}
                  onChange={(e) => setSettings({ ...settings, enforceMfaForStaff: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span className="text-xs text-slate-700">
                  Enforce Multi-Factor Authentication (MFA) for Administrative and Clinical Staff Accounts
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowSelfRegistration}
                  onChange={(e) =>
                    setSettings({ ...settings, allowSelfRegistration: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span className="text-xs text-slate-700">
                  Allow Patient Portal Public Self-Registration on Login Landing Page
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300"
                />
                <span className="text-xs text-rose-700 font-medium">
                  Maintenance Mode: Restrict all non-admin access during database maintenance
                </span>
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Audit Log Retention Window (Days)
              </label>
              <input
                type="number"
                min={30}
                max={3650}
                value={settings.auditLogRetentionDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    auditLogRetentionDays: parseInt(e.target.value) || 365,
                  })
                }
                className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Server-side audit logs older than this duration are automatically archived to cold storage.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              {saving ? "Saving..." : "Save System Configuration"}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
