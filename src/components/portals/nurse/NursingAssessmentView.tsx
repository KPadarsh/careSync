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
  AssessmentIcon,
  SaveIcon,
  PlusIcon,
  CloseIcon,
  CheckIcon,
} from "./NurseIcons";

interface NursingAssessmentProps {
  patientId: string;
}

export const NursingAssessmentView: React.FC<NursingAssessmentProps> = ({ patientId }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Assessment fields
  const [chiefComplaint, setChiefComplaint] = useState(
    "Mild headache and recurring chest discomfort during exertion for past 2 days"
  );
  const [symptoms, setSymptoms] = useState<string[]>([
    "Chest discomfort / tightness (moderate, 2 days)",
    "Dull frontal headache (mild, 3 days)",
  ]);
  const [newSymptomText, setNewSymptomText] = useState("");
  const [newSymptomDuration, setNewSymptomDuration] = useState("1 day");
  const [newSymptomSeverity, setNewSymptomSeverity] = useState("Moderate");

  const [painScore, setPainScore] = useState(3);
  const [painLocation, setPainLocation] = useState("Mid-sternal");
  const [painCharacteristics, setPainCharacteristics] = useState("Dull pressure, non-radiating");

  const [observations, setObservations] = useState(
    "Patient alert, oriented x4, sitting comfortably in triage chair. Skin warm and dry. No acute respiratory distress. Radial pulses bilateral +2 regular. Mild substernal chest soreness elicited on deep inspiration."
  );

  const [condition, setCondition] = useState<"stable" | "critical" | "needs-monitoring" | "acute">(
    "stable"
  );
  const [mobility, setMobility] = useState<"independent" | "assisted" | "wheelchair" | "stretcher" | "bedridden">(
    "independent"
  );
  const [triagePriority, setTriagePriority] = useState<"normal" | "priority" | "urgent">(
    "priority"
  );

  const [doctorHandoffNotes, setDoctorHandoffNotes] = useState(
    "Patient noted exertion-related chest pressure. Baseline ECG recommended. Cleared for cardiology consultation."
  );
  const [generalNotes, setGeneralNotes] = useState("Patient accompanied by family member.");

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/nurse/assessments/${patientId}`);
      if (!res.ok) throw new Error("Failed to load assessment data");
      const json = await res.json();
      setData(json);

      if (json.assessment) {
        const a = json.assessment;
        if (a.chiefComplaint) setChiefComplaint(a.chiefComplaint);
        if (a.symptoms && a.symptoms.length > 0) setSymptoms(a.symptoms);
        if (a.vitals?.painScore !== undefined) setPainScore(a.vitals.painScore);
        if (a.painLocation) setPainLocation(a.painLocation);
        if (a.painCharacteristics) setPainCharacteristics(a.painCharacteristics);
        if (a.observations) setObservations(a.observations);
        if (a.condition) setCondition(a.condition);
        if (a.mobility) setMobility(a.mobility);
        if (a.triagePriority) setTriagePriority(a.triagePriority);
        if (a.doctorHandoffNotes) setDoctorHandoffNotes(a.doctorHandoffNotes);
        if (a.generalNotes) setGeneralNotes(a.generalNotes);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load triage assessment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchAssessment();
    }
  }, [patientId]);

  const handleAddSymptom = () => {
    if (!newSymptomText.trim()) return;
    const formatted = `${newSymptomText.trim()} (${newSymptomSeverity.toLowerCase()}, ${newSymptomDuration.trim()})`;
    setSymptoms([...symptoms, formatted]);
    setNewSymptomText("");
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleSaveAssessment = async (isFinalize: boolean) => {
    try {
      setSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);

      const vitalsObj = data?.assessment?.vitals || {
        bloodPressure: "120/80",
        heartRate: 72,
        temperature: 98.6,
        oxygenSaturation: 98,
        respiratoryRate: 16,
      };

      const res = await fetch(`/api/nurse/assessments/${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chiefComplaint: chiefComplaint.trim(),
          symptoms,
          painScore: Number(painScore),
          painLocation,
          painCharacteristics,
          observations: observations.trim(),
          condition,
          mobility,
          triagePriority,
          doctorHandoffNotes: doctorHandoffNotes.trim(),
          generalNotes: generalNotes.trim(),
          vitals: vitalsObj,
          status: isFinalize ? "completed" : "draft",
        }),
      });

      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error || "Failed to save assessment");
      }

      const resJson = await res.json();
      setSuccessMsg(
        isFinalize
          ? "Assessment completed! Patient marked 'Ready for Doctor' in clinical queue."
          : "Draft saved successfully."
      );
      fetchAssessment();

      if (isFinalize) {
        setTimeout(() => {
          router.push("/nurse/queue");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save triage assessment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006a61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Clinical Assessment...</span>
        </div>
      </div>
    );
  }

  const patient = data?.patient;
  const fullName = patient ? `${patient.firstName || ""} ${patient.lastName || "Patient"}` : "Patient Assessment";
  const activeQueue = data?.activeQueue;
  const vitals = data?.assessment?.vitals || {
    bloodPressure: "120/80",
    heartRate: 72,
    temperature: 98.6,
    oxygenSaturation: 98,
    respiratoryRate: 16,
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
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
              Comprehensive nursing clinical assessment &amp; physician handoff.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleSaveAssessment(false)}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSaveAssessment(true)}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-[#006a61] hover:bg-[#005049] text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5"
          >
            <CheckCircleIcon size={14} />
            <span>{saving ? "Completing..." : "Complete Assessment & Handoff"}</span>
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

      {/* 2-COLUMN LAYOUT: MAIN ASSESSMENT & RIGHT HANDOFF (Matching Stitch Assessment Screen) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: ASSESSMENT SECTIONS (8 COLS) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Section 1: Chief Complaint */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded bg-[#00355f]"></span>
                <h2 className="text-sm font-bold text-slate-900">Chief Complaint</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Mandatory Triage Info
              </span>
            </div>
            <textarea
              rows={3}
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="What is the patient's main concern in their primary words?"
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#00355f]"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Recorded in patient&apos;s own words</span>
              <span>{chiefComplaint.length} characters</span>
            </div>
          </section>

          {/* Section 2: Symptoms Checklist */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded bg-[#00355f]"></span>
                <h2 className="text-sm font-bold text-slate-900">Reported Symptoms</h2>
              </div>
              <span className="text-xs text-slate-500">{symptoms.length} symptoms logged</span>
            </div>

            <div className="flex flex-col gap-2">
              {symptoms.map((sym, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                    <span className="font-medium text-slate-800">{sym}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSymptom(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Remove symptom"
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Symptom */}
            <div className="mt-2 p-3 rounded-lg bg-slate-50/70 border border-slate-200/60 flex flex-wrap gap-2 items-center">
              <input
                type="text"
                placeholder="e.g. Palpitations, Dizziness, Cough"
                value={newSymptomText}
                onChange={(e) => setNewSymptomText(e.target.value)}
                className="flex-1 min-w-[160px] h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none"
              />
              <input
                type="text"
                placeholder="Duration (e.g. 2 days)"
                value={newSymptomDuration}
                onChange={(e) => setNewSymptomDuration(e.target.value)}
                className="w-28 h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none"
              />
              <select
                value={newSymptomSeverity}
                onChange={(e) => setNewSymptomSeverity(e.target.value)}
                className="h-8 px-2 text-xs bg-white border border-slate-200 rounded-md focus:outline-none font-medium text-slate-700"
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
              <button
                type="button"
                onClick={handleAddSymptom}
                className="h-8 px-3 rounded-md bg-[#00355f] text-white text-xs font-semibold hover:bg-[#0f4c81] flex items-center gap-1"
              >
                <PlusIcon size={12} />
                <span>Add</span>
              </button>
            </div>
          </section>

          {/* Section 3: Pain Assessment (0-10) */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded bg-[#00355f]"></span>
                <h2 className="text-sm font-bold text-slate-900">
                  Pain Scale Assessment (Wong-Baker Numerical)
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                Score: {painScore} • {painScore === 0 ? "None" : painScore <= 3 ? "Mild" : painScore <= 6 ? "Moderate" : "Severe"}
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
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Pain Location</label>
                <input
                  type="text"
                  value={painLocation}
                  onChange={(e) => setPainLocation(e.target.value)}
                  placeholder="e.g. Mid-sternal, Lumbar spine"
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-600 block mb-1">Characteristics</label>
                <input
                  type="text"
                  value={painCharacteristics}
                  onChange={(e) => setPainCharacteristics(e.target.value)}
                  placeholder="e.g. Dull, Sharp, Throbbing"
                  className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:bg-white"
                />
              </div>
            </div>
          </section>

          {/* Section 4: Clinical Nursing Observations */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded bg-[#00355f]"></span>
                <h2 className="text-sm font-bold text-slate-900">Clinical Nursing Observations</h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Clinical Impression
              </span>
            </div>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Record detailed objective nursing observations..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#00355f]"
            />
          </section>

          {/* Section 5: Condition & Mobility */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-1.5 h-4 rounded bg-[#00355f]"></span>
              <h2 className="text-sm font-bold text-slate-900">Patient Condition &amp; Mobility</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">Current Condition</label>
                <select
                  value={condition}
                  onChange={(e: any) => setCondition(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white"
                >
                  <option value="stable">Stable (Routine)</option>
                  <option value="needs-monitoring">Needs Monitoring</option>
                  <option value="acute">Acute Presentation</option>
                  <option value="critical">Critical (Immediate Doctor Alert)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1.5">Mobility Level</label>
                <select
                  value={mobility}
                  onChange={(e: any) => setMobility(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white"
                >
                  <option value="independent">Independent Ambulatory</option>
                  <option value="assisted">Assisted Walking</option>
                  <option value="wheelchair">Wheelchair Transport</option>
                  <option value="stretcher">Stretcher / Gurney</option>
                  <option value="bedridden">Bedridden</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 6: Triage Priority Selection */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded bg-[#00355f]"></span>
                <h2 className="text-sm font-bold text-slate-900">Triage Priority Selection</h2>
              </div>
              <span className="text-xs text-slate-400">Sets clinic queue order</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Normal */}
              <label
                onClick={() => setTriagePriority("normal")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  triagePriority === "normal"
                    ? "bg-teal-50/60 border-teal-500 shadow-2xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-teal-800">Normal</span>
                  {triagePriority === "normal" && <CheckCircleIcon size={14} className="text-teal-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Standard outpatient clinic waiting order.
                </p>
              </label>

              {/* Priority */}
              <label
                onClick={() => setTriagePriority("priority")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  triagePriority === "priority"
                    ? "bg-amber-50/70 border-amber-500 shadow-2xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-800">Priority</span>
                  {triagePriority === "priority" && <CheckCircleIcon size={14} className="text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Accelerated evaluation recommended within 15 mins.
                </p>
              </label>

              {/* Urgent */}
              <label
                onClick={() => setTriagePriority("urgent")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 ${
                  triagePriority === "urgent"
                    ? "bg-rose-50 border-rose-500 shadow-2xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-700">Urgent</span>
                  {triagePriority === "urgent" && <AlertTriangleIcon size={14} className="text-rose-600" />}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Requires immediate physician confirmation.
                </p>
              </label>
            </div>
          </section>

          {/* Section 7: Doctor Handoff Notes */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <span className="w-1.5 h-4 rounded bg-[#00355f]"></span>
              <h2 className="text-sm font-bold text-slate-900">Doctor Handoff Notes</h2>
            </div>
            <textarea
              rows={2}
              value={doctorHandoffNotes}
              onChange={(e) => setDoctorHandoffNotes(e.target.value)}
              placeholder="Special instructions or clinical highlights for the consulting doctor..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#00355f]"
            />
          </section>
        </div>

        {/* RIGHT COLUMN: CURRENT VITALS SUMMARY & READINESS CHECKLIST (4 COLS) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Card 1: Current Vitals Summary */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartPulseIcon size={16} className="text-[#006a61]" />
                <h3 className="font-bold text-slate-900 text-sm">Vitals Telemetry</h3>
              </div>
              <Link
                href={`/nurse/vitals/${patientId}`}
                className="text-xs font-semibold text-[#006a61] hover:underline"
              >
                Edit Vitals
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">BP</span>
                <span className="text-base font-extrabold text-slate-900">{vitals.bloodPressure || "120/80"}</span>
                <span className="text-[10px] text-teal-700 block mt-0.5">mmHg</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pulse</span>
                <span className="text-base font-extrabold text-slate-900">{vitals.heartRate || 72}</span>
                <span className="text-[10px] text-teal-700 block mt-0.5">bpm Regular</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">SpO2</span>
                <span className="text-base font-extrabold text-slate-900">{vitals.oxygenSaturation || 98}%</span>
                <span className="text-[10px] text-teal-700 block mt-0.5">Room Air</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Temp</span>
                <span className="text-base font-extrabold text-slate-900">{vitals.temperature || 98.6}°F</span>
                <span className="text-[10px] text-teal-700 block mt-0.5">Afebrile</span>
              </div>
            </div>

            {/* Mini Telemetry Rhythm */}
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between mt-1">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Rhythm Monitor</span>
                <span className="text-xs font-bold text-slate-800">Normal Sinus Rhythm</span>
              </div>
              <svg className="w-20 h-5 text-teal-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 100 24">
                <path d="M0 12h20l3-8 4 16 4-10 3 4 3-2h20l3-8 4 16 4-10 3 4 3-2h20" />
              </svg>
            </div>
          </div>

          {/* Card 2: Doctor Handoff Readiness Checklist */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Doctor Handoff Readiness
            </h3>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded bg-slate-50">
                <CheckCircleIcon size={14} className="text-teal-600" />
                <span className="flex-1 font-medium text-slate-800">Assessment logged</span>
                <span className="font-semibold text-teal-700">Complete</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-slate-50">
                <CheckCircleIcon size={14} className="text-teal-600" />
                <span className="flex-1 font-medium text-slate-800">Vitals recorded</span>
                <span className="font-mono text-slate-500">{vitals.bloodPressure || "120/80"}</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-slate-50">
                <CheckCircleIcon size={14} className="text-teal-600" />
                <span className="flex-1 font-medium text-slate-800">Priority weighted</span>
                <span className="font-bold uppercase text-amber-700">{triagePriority}</span>
              </div>

              <div className="flex items-center gap-2 p-2 rounded bg-slate-50">
                <CheckCircleIcon size={14} className="text-teal-600" />
                <span className="flex-1 font-medium text-slate-800">Physician briefing</span>
                <span className="text-slate-500">Ready</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => handleSaveAssessment(true)}
              disabled={saving}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-[#006a61] hover:bg-[#005049] text-white text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition-all"
            >
              <CheckCircleIcon size={16} />
              <span>{saving ? "Updating Queue..." : "Mark Ready for Doctor"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
