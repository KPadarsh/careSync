"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  StethoscopeIcon,
  PrescriptionsIcon,
  LabIcon,
  RecordsIcon,
} from "./DoctorIcons";

interface PatientClinicalViewProps {
  patientId: string;
}

export const PatientClinicalView: React.FC<PatientClinicalViewProps> = ({ patientId }) => {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/doctor/patients/${patientId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load patient clinical view:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [patientId]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-12 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-sm font-medium text-slate-500">
          Loading patient clinical chart...
        </span>
      </div>
    );
  }

  if (!data || !data.patient) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="p-6 bg-white rounded-xl shadow-xs border border-rose-200 text-center">
          <p className="text-rose-700 font-semibold text-sm">Patient clinical profile not found.</p>
          <Link
            href="/doctor/patients"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
          >
            <ArrowBackIcon className="w-4 h-4" />
            <span>Return to Patients Directory</span>
          </Link>
        </div>
      </div>
    );
  }

  const patient = data.patient;
  const todayVisit = data.todayVisit;
  const nurseAssessment = data.nursingAssessment;
  const previousConsultations = data.previousConsultations || [];
  const prescriptions = data.prescriptions || [];
  const verifiedLabReports = data.verifiedLabReports || [];

  const initials = patient.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const vitals = nurseAssessment?.vitals || {};
  const hasPenicillin = patient.allergies?.some((a: string) =>
    a.toLowerCase().includes("penicillin")
  );

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Bar / Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/doctor/queue"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowBackIcon className="w-3.5 h-3.5" />
            <span>Today&apos;s Queue</span>
          </Link>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {patient.name}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {patient.mrn}
            </span>
            {todayVisit && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Checked In: {todayVisit.ticketNumber}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => router.push(`/doctor/consultations/${patient._id}`)}
            type="button"
            className="px-4 py-2 rounded-lg text-white bg-slate-900 hover:bg-slate-800 shadow-xs text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <StethoscopeIcon className="w-4 h-4" />
            <span>Start Consultation</span>
          </button>
        </div>
      </div>

      {/* Patient Snapshot Banner (Demographics + Allergy Safety + Live Vitals Ribbon) */}
      <div className="w-full bg-white rounded-xl shadow-xs border border-slate-200/80 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Demographic & Safety */}
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 pr-4 border-r border-slate-200/80">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 leading-tight">
                {patient.age} yrs • {patient.gender}
              </span>
              <span className="text-xs text-slate-500 leading-tight mt-0.5">
                Blood Group: <strong className="text-slate-800 font-semibold">{patient.bloodGroup}</strong>
              </span>
            </div>
          </div>

          {/* Allergy Chip */}
          {hasPenicillin ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
              <AlertTriangleIcon className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-xs font-semibold">
                Allergies: Penicillin (High Risk)
              </span>
            </div>
          ) : patient.allergies && patient.allergies.length > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-xs font-medium">
                Allergies: {patient.allergies.join(", ")}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-500 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
              No Known Drug Allergies
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Phone: {patient.phone}
            </span>
          </div>
        </div>

        {/* Live Triage Vitals Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Blood Pressure
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-900">
                {vitals.bloodPressure || "120/80"}
              </span>
              <span className="text-[10px] text-slate-400">mmHg</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Heart Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-900">
                {vitals.heartRate || 72}
              </span>
              <span className="text-[10px] text-slate-400">bpm</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              SpO2
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-900">
                {vitals.oxygenSaturation || 98}%
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold">Normal</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Temp
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-900">
                {vitals.temperature || 98.6}
              </span>
              <span className="text-[10px] text-slate-400">°F</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 flex flex-col shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Resp Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-900">
                {vitals.respiratoryRate || 18}
              </span>
              <span className="text-[10px] text-slate-400">/min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Clinical Grid: Left (8 cols) + Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Clinical Assessment, History, Labs */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. Today's Nursing Assessment & Handoff */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-slate-50/80 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-slate-100">
              <div className="flex items-center gap-2">
                <StethoscopeIcon className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Today&apos;s Triage &amp; Nursing Handoff
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                Logged by {nurseAssessment?.nurseName || "Nursing Staff"}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Reported Chief Complaint
                </span>
                <div className="p-3 bg-slate-50 rounded-lg text-xs sm:text-sm text-slate-900 font-medium border border-slate-100">
                  {nurseAssessment?.chiefComplaint ||
                    todayVisit?.reason ||
                    "Routine follow-up evaluation and clinical monitoring."}
                </div>
              </div>

              {nurseAssessment?.doctorHandoffNotes && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Nurse Handoff Notes for Attending Doctor
                  </span>
                  <div className="p-3 bg-amber-50 rounded-lg text-xs sm:text-sm text-amber-950 border border-amber-200/70">
                    {nurseAssessment.doctorHandoffNotes}
                  </div>
                </div>
              )}

              {nurseAssessment?.observations && (
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Clinical Observations
                  </span>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {nurseAssessment.observations}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 2. Previous Consultations */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-slate-50/80 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RecordsIcon className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Previous Consultations &amp; Clinical Encounters
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                {previousConsultations.length} Encounters
              </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-100">
              {previousConsultations.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">
                  No past consultation records on file for this patient.
                </p>
              ) : (
                previousConsultations.map((v: any) => (
                  <div key={v._id} className="py-3 flex flex-col gap-1 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">
                          {v.diagnosis || v.reason}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          {new Date(v.date).toLocaleDateString()} • {v.doctorName} ({v.specialty})
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        Finalized
                      </span>
                    </div>
                    {v.summary && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {v.summary}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 3. Verified Pathology / Lab Reports */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-slate-50/80 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LabIcon className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Verified Laboratory Diagnostics
                </h2>
              </div>
              <span className="text-xs text-emerald-700 font-semibold">
                Pathologist Verified
              </span>
            </div>

            <div className="flex flex-col divide-y divide-slate-100">
              {verifiedLabReports.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">
                  No verified lab reports available.
                </p>
              ) : (
                verifiedLabReports.map((l: any) => (
                  <div key={l._id} className="py-3 flex flex-col gap-1.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">
                          {l.testName}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          Verified on {l.verifiedDate ? new Date(l.verifiedDate).toLocaleDateString() : "Recently"} by {l.verifiedBy}
                        </span>
                      </div>
                      <Link
                        href={`/doctor/lab/${l._id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>View Parameters</span>
                        <ArrowForwardIcon className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <p className="text-xs text-slate-500">
                      {l.summary}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Active Prescriptions & Patient Contact/Insurance */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Active Prescriptions */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-slate-50/80 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PrescriptionsIcon className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Prescriptions
                </h2>
              </div>
              <span className="text-xs font-semibold text-blue-600">
                {prescriptions.length} Regimens
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {prescriptions.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No active prescriptions authored.
                </p>
              ) : (
                prescriptions.slice(0, 3).map((rx: any) => (
                  <div
                    key={rx._id}
                    className="p-3 rounded-lg bg-slate-50 flex flex-col gap-1 border border-slate-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900">
                        {new Date(rx.date).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {rx.status?.toUpperCase() || "ACTIVE"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {rx.medications?.map((m: any, mIdx: number) => (
                        <div key={mIdx} className="text-xs text-slate-800">
                          • <strong className="font-semibold">{m.medicine}</strong> ({m.dosage}) — {m.frequency}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <Link
                href="/doctor/prescriptions"
                className="text-xs text-blue-600 font-semibold hover:underline mt-1 text-center"
              >
                View Complete Medication History →
              </Link>
            </div>
          </section>

          {/* Emergency & Insurance Info */}
          <section className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-slate-900">
              Patient Contact &amp; Insurance
            </h3>
            <div className="text-xs text-slate-600 flex flex-col gap-2">
              <div>
                <span className="text-slate-400 uppercase tracking-wider text-[10px] block">
                  Emergency Contact
                </span>
                <span className="font-medium text-slate-800">
                  {patient.emergencyContact?.name || "Family Contact"} ({patient.emergencyContact?.relationship || "Family"})
                </span>
                <span className="block text-slate-500">
                  {patient.emergencyContact?.phone || patient.phone}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 uppercase tracking-wider text-[10px] block">
                  Insurance Provider
                </span>
                <span className="font-medium text-slate-800">
                  {patient.insurance?.provider || "Direct Hospital Care"}
                </span>
                <span className="block text-slate-500">
                  Policy: {patient.insurance?.policyNumber || "N/A"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
