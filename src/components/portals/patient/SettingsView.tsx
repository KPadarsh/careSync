"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

export function SettingsView() {
  const [settings, setSettings] = useState({
    smsNotifications: true,
    emailNotifications: true,
    appointmentReminders: true,
    labResultsAlerts: true,
    twoFactorAuth: false,
  });
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    fetch("/api/patient/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error("Error loading settings:", err));
  }, []);

  const handleToggle = async (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setSaving(true);
    setSavedMessage("");

    try {
      await fetch("/api/patient/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setSavedMessage("Preference saved.");
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Portal Settings</h2>
          <p className="text-sm text-[#45464d] mt-1">
            Manage your notification channels, clinic alert preferences, and account security.
          </p>
        </div>
        {saving && (
          <span className="text-xs text-primary font-medium flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Saving...
          </span>
        )}
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {savedMessage}
        </div>
      )}

      {/* Notifications Settings */}
      <Card className="p-6 border border-[#e2e8f0] shadow-sm space-y-4 bg-white">
        <h3 className="text-base font-bold text-[#0b1c30]">Communication &amp; Alert Preferences</h3>
        <p className="text-xs text-[#45464d]">
          Control how you receive appointment confirmations, doctor instructions, and test updates.
        </p>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#e2e8f0] bg-[#eff4ff]/30 cursor-pointer hover:bg-[#eff4ff]/50 transition-colors">
            <div>
              <p className="text-xs font-bold text-[#0b1c30]">SMS Appointment Alerts</p>
              <p className="text-[11px] text-[#45464d]">Receive automated SMS alerts 24 hours prior to consultations.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.smsNotifications}
              onChange={(e) => handleToggle("smsNotifications", e.target.checked)}
              className="h-4 w-4 rounded border-[#e2e8f0] text-[#131b2e] focus:ring-[#131b2e] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#e2e8f0] bg-[#eff4ff]/30 cursor-pointer hover:bg-[#eff4ff]/50 transition-colors">
            <div>
              <p className="text-xs font-bold text-[#0b1c30]">Immediate Verified Lab Notifications</p>
              <p className="text-[11px] text-[#45464d]">Get notified when pathologist certifies your diagnostic findings.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.labResultsAlerts}
              onChange={(e) => handleToggle("labResultsAlerts", e.target.checked)}
              className="h-4 w-4 rounded border-[#e2e8f0] text-[#131b2e] focus:ring-[#131b2e] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#e2e8f0] bg-[#eff4ff]/30 cursor-pointer hover:bg-[#eff4ff]/50 transition-colors">
            <div>
              <p className="text-xs font-bold text-[#0b1c30]">Email Appointment Summaries</p>
              <p className="text-[11px] text-[#45464d]">Receive doctor encounter notes and digital prescription links via email.</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) => handleToggle("emailNotifications", e.target.checked)}
              className="h-4 w-4 rounded border-[#e2e8f0] text-[#131b2e] focus:ring-[#131b2e] cursor-pointer"
            />
          </label>
        </div>
      </Card>

      {/* Security Credentials */}
      <Card className="p-6 border border-[#e2e8f0] shadow-sm space-y-4 bg-white">
        <h3 className="text-base font-bold text-[#0b1c30]">Account Security</h3>
        <p className="text-xs text-[#45464d]">Patient credentials and authentication options.</p>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div>
            <p className="text-xs font-bold text-[#0b1c30]">Two-Factor Authentication (2FA)</p>
            <p className="text-[11px] text-[#45464d]">Protect your medical records with an extra layer of verification.</p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle("twoFactorAuth", !settings.twoFactorAuth)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border ${
              settings.twoFactorAuth
                ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
                : "bg-white text-[#45464d] border-[#e2e8f0] hover:bg-[#eff4ff]"
            }`}
          >
            {settings.twoFactorAuth ? "Enabled" : "Enable 2FA"}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#e2e8f0]">
          <div>
            <p className="text-xs font-bold text-[#0b1c30]">Account Password</p>
            <p className="text-[11px] text-[#45464d]">Standard strong password protection enabled.</p>
          </div>
          <span className="text-xs font-semibold text-[#006a61] bg-[#eff4ff] px-3 py-1 rounded">
            Managed via CareSync Auth
          </span>
        </div>
      </Card>
    </div>
  );
}
