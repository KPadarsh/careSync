"use client";

import React, { useState, useEffect } from "react";
import {
  IconSettings,
  IconCheckCircle,
  IconShield,
  IconClock,
  IconBuilding,
  IconRefresh,
  IconBell,
  IconFileText,
  IconAlertTriangle,
} from "./DoctorIcons";

export function SettingsView() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Settings states
  const [slotDuration, setSlotDuration] = useState(30);
  const [roomNumber, setRoomNumber] = useState("Consultation Room 302");
  const [autoAdvanceQueue, setAutoAdvanceQueue] = useState(true);
  const [notifyUrgentTriage, setNotifyUrgentTriage] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [defaultTemplate, setDefaultTemplate] = useState(true);
  const [allergyStrict, setAllergyStrict] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/doctor/settings");
      if (res.ok) {
        const data = await res.json();
        const s = data.settings;
        if (s.slotDurationMinutes) setSlotDuration(s.slotDurationMinutes);
        if (s.roomNumber) setRoomNumber(s.roomNumber);
        if (s.autoAdvanceQueue !== undefined) setAutoAdvanceQueue(s.autoAdvanceQueue);
        if (s.notifyUrgentTriage !== undefined) setNotifyUrgentTriage(s.notifyUrgentTriage);
        if (s.soundAlerts !== undefined) setSoundAlerts(s.soundAlerts);
        if (s.defaultCardioTemplate !== undefined) setDefaultTemplate(s.defaultCardioTemplate);
        if (s.allergyWarningStrict !== undefined) setAllergyStrict(s.allergyWarningStrict);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch("/api/doctor/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotDurationMinutes: Number(slotDuration),
          roomNumber: roomNumber.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Doctor preferences saved successfully." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update settings." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error saving settings." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-secondary bg-white rounded-xl border border-outline-variant/30">
        <IconRefresh className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
        Loading settings...
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
            <IconSettings className="w-4 h-4 text-primary" />
          </span>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Clinical Settings</h1>
        </div>
        <p className="text-sm text-secondary">
          Configure consultation duration, room allocation, triage alerts, and safety check protocols.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border ${
            message.type === "success"
              ? "bg-tertiary-fixed/30 border-tertiary-fixed text-on-tertiary-fixed"
              : "bg-error-container border-error/30 text-error"
          }`}
        >
          {message.type === "success" ? (
            <IconCheckCircle className="w-5 h-5 shrink-0 text-tertiary" />
          ) : (
            <IconAlertTriangle className="w-5 h-5 shrink-0 text-error" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Clinical Practice & Scheduling */}
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6 space-y-5">
          <div className="border-b border-outline-variant/30 pb-3 flex items-center gap-2">
            <IconClock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-on-surface">Consultation Schedule &amp; Room</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Default Consultation Slot Duration
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full h-10 px-3 bg-white border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value={15}>15 minutes (Express review)</option>
                <option value={20}>20 minutes (Standard)</option>
                <option value={30}>30 minutes (Comprehensive / Default)</option>
                <option value={45}>45 minutes (Detailed diagnostic)</option>
                <option value={60}>60 minutes (Specialist procedure)</option>
              </select>
              <p className="text-[11px] text-secondary mt-1">
                Dictates receptionist appointment book slots and queue time intervals.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Assigned Consultation Room</label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Consultation Room 302"
                className="w-full h-10 px-3 bg-white border border-outline-variant/50 rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary"
              />
              <p className="text-[11px] text-secondary mt-1">
                Displayed on the waiting hall display monitor and nurse triage board.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Patient Safety & Triage Automation */}
        <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6 space-y-5">
          <div className="border-b border-outline-variant/30 pb-3 flex items-center gap-2">
            <IconShield className="w-5 h-5 text-tertiary" />
            <h3 className="font-semibold text-on-surface">Clinical Safety &amp; Alert Protocol</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/20">
              <div className="pr-4">
                <p className="text-xs font-semibold text-on-surface">Strict Allergy Countermeasures</p>
                <p className="text-[11px] text-secondary mt-0.5">
                  Prominently highlight drug contraindications (e.g., Penicillin, Aspirin) during prescription drafting.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allergyStrict}
                onChange={(e) => setAllergyStrict(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/20">
              <div className="pr-4">
                <p className="text-xs font-semibold text-on-surface">Urgent Nurse Triage Notifications</p>
                <p className="text-[11px] text-secondary mt-0.5">
                  Receive high-priority banner notifications when nursing hands off a critical (Red) patient.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyUrgentTriage}
                onChange={(e) => setNotifyUrgentTriage(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/20">
              <div className="pr-4">
                <p className="text-xs font-semibold text-on-surface">Auto-Advance Queue Upon Consultation Completion</p>
                <p className="text-[11px] text-secondary mt-0.5">
                  Automatically set the next triaged patient to &apos;In-Consultation&apos; when finalizing encounter notes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoAdvanceQueue}
                onChange={(e) => setAutoAdvanceQueue(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer border border-outline-variant/20">
              <div className="pr-4">
                <p className="text-xs font-semibold text-on-surface">Pre-fill Diagnostic Exam Templates</p>
                <p className="text-[11px] text-secondary mt-0.5">
                  Auto-load cardiovascular and respiratory physical examination templates for new encounters.
                </p>
              </div>
              <input
                type="checkbox"
                checked={defaultTemplate}
                onChange={(e) => setDefaultTemplate(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-outline-variant focus:ring-primary"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Role & Boundary Security Notice */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-5 space-y-2">
          <div className="flex items-center gap-2 text-secondary">
            <IconShield className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider">
              CareSync RBAC Security Enforcement
            </h4>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            By system policy, Doctor Portal credentials have strict separation of duties. Doctors cannot dispense pharmacy medications, create billing invoices, verify pathology reports, modify nursing triage notes, or silently delete finalized clinical encounters. Revisions require signed clinical addendums.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? "Saving Preferences..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
