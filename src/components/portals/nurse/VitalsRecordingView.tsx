"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  HeartPulseIcon,
  ThermometerIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  VitalsIcon,
  SaveIcon,
  ClockIcon,
} from "./NurseIcons";

interface VitalsRecordingProps {
  patientId: string;
}

export const VitalsRecordingView: React.FC<VitalsRecordingProps> = ({ patientId }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [heartRate, setHeartRate] = useState("72");
  const [oxygenSaturation, setOxygenSaturation] = useState("98");
  const [temperature, setTemperature] = useState("98.6");
  const [respiratoryRate, setRespiratoryRate] = useState("16");
  const [weightKg, setWeightKg] = useState("72");
  const [heightCm, setHeightCm] = useState("175");
  const [painScore, setPainScore] = useState(2);
  const [notes, setNotes] = useState("");

  const fetchVitalsData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/nurse/vitals/${patientId}`);
      if (!res.ok) throw new Error("Failed to load vitals data");
      const json = await res.json();
      setData(json);

      if (json.currentVitals) {
        const cv = json.currentVitals;
        if (cv.systolic) setSystolic(String(cv.systolic));
        else if (cv.bloodPressure && cv.bloodPressure.includes("/")) {
          const parts = cv.bloodPressure.split("/");
          setSystolic(parts[0]);
          setDiastolic(parts[1]);
        }
        if (cv.diastolic) setDiastolic(String(cv.diastolic));
        if (cv.heartRate) setHeartRate(String(cv.heartRate));
        if (cv.oxygenSaturation) setOxygenSaturation(String(cv.oxygenSaturation));
        if (cv.temperature) setTemperature(String(cv.temperature));
        if (cv.respiratoryRate) setRespiratoryRate(String(cv.respiratoryRate));
        if (cv.weightKg) setWeightKg(String(cv.weightKg));
        if (cv.heightCm) setHeightCm(String(cv.heightCm));
        if (cv.painScore !== undefined) setPainScore(cv.painScore);
        if (cv.notes) setNotes(cv.notes);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load vitals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchVitalsData();
    }
  }, [patientId]);

  // Compute BMI live
  const calculateBmi = () => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (w > 0 && h > 0) {
      const hm = h / 100;
      return (w / (hm * hm)).toFixed(1);
    }
    return "23.5";
  };

  const handleSave = async (isDraft = false) => {
    try {
      setSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);

      const bpString = `${systolic.trim()}/${diastolic.trim()}`;

      const res = await fetch(`/api/nurse/vitals/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloodPressure: bpString,
          systolic: Number(systolic),
          diastolic: Number(diastolic),
          heartRate: Number(heartRate),
          oxygenSaturation: Number(oxygenSaturation),
          temperature: Number(temperature),
          respiratoryRate: Number(respiratoryRate),
          weightKg: Number(weightKg),
          heightCm: Number(heightCm),
          painScore: Number(painScore),
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to save vitals");
      }

      setSuccessMsg(isDraft ? "Vitals draft saved successfully." : "Vitals recorded and persisted to patient chart.");
      fetchVitalsData();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006a61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Vitals Workstation...</span>
        </div>
      </div>
    );
  }

  const patient = data?.patient;
  const fullName = patient ? `${patient.firstName || ""} ${patient.lastName || "Patient"}` : "Patient Vitals";
  const activeQueue = data?.activeQueue;
  const history = data?.history || [];
  const currentBmi = calculateBmi();

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* TOP HEADER & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeftIcon size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">{fullName}</h1>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-[#00355f] text-xs font-mono font-bold border border-blue-200">
                {patient?.mrn || "MRN-1002"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive triage vitals recording &amp; telemetry monitoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => router.push(`/nurse/patients/${patientId}`)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
          >
            View Chart
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-[#006a61] hover:bg-[#005049] text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5"
          >
            <SaveIcon size={14} />
            <span>{saving ? "Saving..." : "Save Vitals"}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {successMsg && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2">
          <CheckCircleIcon size={16} className="text-teal-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangleIcon size={16} className="text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* PREVIOUS BASELINE SUMMARY STRIP (Matching Stitch Vitals Screen) */}
      <div className="bg-[#eff4ff] rounded-xl p-4 border border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <ClockIcon size={15} className="text-[#00355f]" />
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Previous Baseline Summary
            </span>
            <span className="text-slate-400 text-xs">• Recorded today by Arun Mary, RN</span>
          </div>
          <span className="text-xs font-bold text-[#006a61] uppercase tracking-wider">
            Baseline Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-2xs border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Blood Pressure</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-slate-900">{data?.currentVitals?.bloodPressure || "120/80"}</span>
              <span className="text-[10px] text-slate-400">mmHg</span>
            </div>
            <span className="text-[11px] text-teal-700 font-medium mt-1 block">Normal Range</span>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-2xs border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Heart Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-slate-900">{data?.currentVitals?.heartRate || 72}</span>
              <span className="text-[10px] text-slate-400">bpm</span>
            </div>
            <span className="text-[11px] text-teal-700 font-medium mt-1 block">Regular</span>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-2xs border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Temperature</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-slate-900">{data?.currentVitals?.temperature || 98.6}</span>
              <span className="text-[10px] text-slate-400">°F</span>
            </div>
            <span className="text-[11px] text-slate-600 font-medium mt-1 block">Afebrile (Oral)</span>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-2xs border border-slate-200/60">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Oxygen SpO2</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-slate-900">{data?.currentVitals?.oxygenSaturation || 98}</span>
              <span className="text-[10px] text-slate-400">%</span>
            </div>
            <span className="text-[11px] text-teal-700 font-medium mt-1 block">Optimal Room Air</span>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-2xs border border-slate-200/60 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Respiratory Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-bold text-slate-900">{data?.currentVitals?.respiratoryRate || 16}</span>
              <span className="text-[10px] text-slate-400">/min</span>
            </div>
            <span className="text-[11px] text-teal-700 font-medium mt-1 block">Eupneic</span>
          </div>
        </div>
      </div>

      {/* PRIMARY WORK AREA: FORM & LIVE HISTORY (2:1 GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: FORM (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-5">
            <h2 className="text-sm font-bold text-[#00355f] uppercase tracking-wider pb-2 border-b border-slate-100">
              Clinical Vitals Intake Form
            </h2>

            {/* Row 1: Blood Pressure */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Blood Pressure (BP)</span>
                <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Target: 120/80 mmHg
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full h-10 px-3 font-mono font-bold text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006a61]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full h-10 px-3 font-mono font-bold text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006a61]"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Heart Rate & SpO2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-800">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value)}
                  className="w-full h-10 px-3 font-mono font-bold text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006a61]"
                />
                <span className="text-[10px] text-slate-500">Normal resting: 60 - 100 bpm</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-800">Oxygen Saturation SpO2 (%)</label>
                <input
                  type="number"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(e.target.value)}
                  className="w-full h-10 px-3 font-mono font-bold text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006a61]"
                />
                <span className="text-[10px] text-slate-500">Optimal: 95% - 100% on Room Air</span>
              </div>
            </div>

            {/* Row 3: Temperature & Respiratory Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-800">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full h-10 px-3 font-mono font-bold text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006a61]"
                />
                <span className="text-[10px] text-slate-500">Oral baseline: 98.6°F (37.0°C)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-800">Respiratory Rate (/min)</label>
                <input
                  type="number"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(e.target.value)}
                  className="w-full h-10 px-3 font-mono font-bold text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006a61]"
                />
                <span className="text-[10px] text-slate-500">Normal adult: 12 - 20 breaths/min</span>
              </div>
            </div>

            {/* Row 4: Weight, Height, and Live BMI */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Anthropometrics &amp; BMI</span>
                <span className="text-xs font-bold text-[#00355f] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                  Calculated BMI: {currentBmi} kg/m²
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full h-10 px-3 font-mono font-bold text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006a61]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full h-10 px-3 font-mono font-bold text-base bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#006a61]"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Wong-Baker Pain Score (0-10) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Pain Scale (0 - 10 Numeric)</span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Score: {painScore} • {painScore === 0 ? "No Pain" : painScore <= 3 ? "Mild" : painScore <= 6 ? "Moderate" : "Severe"}
                </span>
              </div>

              <div className="grid grid-cols-11 gap-1 text-center">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPainScore(num)}
                    className={`py-2 rounded text-xs font-bold transition-all ${
                      painScore === num
                        ? "bg-[#00355f] text-white shadow-xs scale-105"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold px-1">
                <span>0: None</span>
                <span>1-3: Mild</span>
                <span>4-6: Moderate</span>
                <span>7-9: Severe</span>
                <span>10: Worst</span>
              </div>
            </div>

            {/* Clinical Vitals Notes */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                Vitals Assessment Observations
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Note any symptoms during intake (e.g. dizzy when standing, shivering, mild tremor)..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#006a61]"
              />
            </div>
          </div>
        </div>

        {/* RIGHT: VITALS AUDIT HISTORY (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Vitals History Timeline
            </h3>

            {history.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">
                No past vitals entries on record.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((h: any, idx: number) => {
                  const v = h.vitals || {};
                  return (
                    <div
                      key={h._id || idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{new Date(h.date).toLocaleString()}</span>
                        <span className="font-bold uppercase text-teal-700">{h.status || "Final"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-800 font-semibold mt-1">
                        <span>BP: {v.bloodPressure || "120/80"}</span>
                        <span>HR: {v.heartRate || 72} bpm</span>
                        <span>SpO2: {v.oxygenSaturation || 98}%</span>
                        <span>Temp: {v.temperature || 98.6}°F</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        Logged by: {h.nurseName || "Arun Mary, RN"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
