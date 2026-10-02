"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  IconSettings,
  IconCheckCircle,
  IconShield,
  IconClock,
  IconRefresh,
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
      <div className="w-full max-w-7xl mx-auto p-12 flex flex-col items-center justify-center min-h-[50vh]">
        <IconRefresh className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <span className="text-sm font-medium text-slate-500">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <PageHeader
        title="Clinical Settings"
        description="Configure consultation duration, room allocation, triage alerts, and safety check protocols."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Practice Configuration
          </span>
        }
      />

      {message && (
        <div
          className={`p-3.5 rounded-xl flex items-center gap-3 border text-xs sm:text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <IconCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <IconAlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Clinical Practice & Scheduling */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <IconClock className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-slate-900">Consultation Schedule &amp; Room</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Consultation Slot Duration
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value={15}>15 minutes (Express review)</option>
                <option value={20}>20 minutes (Standard)</option>
                <option value={30}>30 minutes (Comprehensive / Default)</option>
                <option value={45}>45 minutes (Detailed diagnostic)</option>
                <option value={60}>60 minutes (Specialist procedure)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Dictates receptionist appointment book slots and queue time intervals.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Consultation Room</label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Consultation Room 302"
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Displayed on the waiting hall display monitor and nurse triage board.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Patient Safety & Triage Automation */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <IconShield className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm text-slate-900">Clinical Safety &amp; Alert Protocol</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/70 transition-colors cursor-pointer">
              <div className="pr-3">
                <p className="text-xs font-semibold text-slate-800">Strict Allergy Countermeasures</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Prominently highlight drug contraindications (e.g., Penicillin, Aspirin) during prescription drafting.
                </p>
              </div>
              <input
                type="checkbox"
                checked={allergyStrict}
                onChange={(e) => setAllergyStrict(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
              />
            </label>

            <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/70 transition-colors cursor-pointer">
              <div className="pr-3">
                <p className="text-xs font-semibold text-slate-800">Urgent Nurse Triage Notifications</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Receive high-priority banner notifications when nursing hands off a critical (Red) patient.
                </p>
              </div>
              <input
                type="checkbox"
                checked={notifyUrgentTriage}
                onChange={(e) => setNotifyUrgentTriage(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
              />
            </label>

            <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/70 transition-colors cursor-pointer">
              <div className="pr-3">
                <p className="text-xs font-semibold text-slate-800">Auto-Advance Queue Upon Completion</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Automatically set the next triaged patient to &apos;In-Consultation&apos; when finalizing encounter notes.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoAdvanceQueue}
                onChange={(e) => setAutoAdvanceQueue(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
              />
            </label>

            <label className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200/80 hover:bg-slate-50/70 transition-colors cursor-pointer">
              <div className="pr-3">
                <p className="text-xs font-semibold text-slate-800">Pre-fill Diagnostic Exam Templates</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Auto-load cardiovascular and respiratory physical examination templates for new encounters.
                </p>
              </div>
              <input
                type="checkbox"
                checked={defaultTemplate}
                onChange={(e) => setDefaultTemplate(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
              />
            </label>
          </div>
        </div>

        {/* Section 3: Role & Boundary Security Notice */}
        <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 sm:p-5 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-700">
            <IconShield className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              CareSync RBAC Security Enforcement
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            By system policy, Doctor Portal credentials have strict separation of duties. Doctors cannot dispense pharmacy medications, create billing invoices, verify pathology reports, modify nursing triage notes, or silently delete finalized clinical encounters. Revisions require signed clinical addendums.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            {saving ? "Saving Preferences..." : "Save Preferences"}
          </button>
        </div>
      </form>
    </div>
  );
}
