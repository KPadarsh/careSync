"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBackIcon,
  ArrowForwardIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006194] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-[#565e74]">
            Loading patient clinical chart...
          </span>
        </div>
      </div>
    );
  }

  if (!data || !data.patient) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-6 bg-white rounded-xl shadow-xs border border-red-200 text-center">
          <p className="text-red-700 font-semibold">Patient clinical profile not found.</p>
          <Link
            href="/doctor/patients"
            className="mt-4 inline-flex items-center gap-1 text-sm text-[#006194] hover:underline"
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
    <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Bar / Navigation & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/doctor/queue"
            className="inline-flex items-center gap-1 text-[13px] text-[#565e74] hover:text-[#006194] transition-colors font-medium"
          >
            <ArrowBackIcon className="w-4 h-4" />
            <span>Today's Queue</span>
          </Link>
          <span className="text-[#bfc7d2]">•</span>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
              {patient.name}
            </h1>
            <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] font-semibold border border-[#bfc7d2]/30">
              {patient.mrn}
            </span>
            {todayVisit && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[12px] font-medium border border-emerald-200">
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
            className="px-4 py-2 rounded-lg text-white bg-[#006194] hover:bg-[#007bb9] shadow-xs text-[13px] font-semibold flex items-center gap-2 transition-colors"
          >
            <StethoscopeIcon className="w-4 h-4" />
            <span>Start Consultation</span>
          </button>
        </div>
      </div>

      {/* Patient Snapshot Banner (Demographics + Allergy Safety + Live Vitals Ribbon) */}
      <div className="w-full bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Demographic & Safety */}
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 pr-4 border-r border-[#bfc7d2]/30">
            <div className="w-11 h-11 rounded-full bg-[#dae2fd] text-[#131b2e] flex items-center justify-center font-bold text-base shrink-0">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-[#0b1c30] leading-tight">
                {patient.age} yrs • {patient.gender}
              </span>
              <span className="text-[12px] text-[#565e74] leading-tight mt-0.5">
                Blood: <strong className="text-[#0b1c30] font-semibold">{patient.bloodGroup}</strong>
              </span>
            </div>
          </div>

          {/* Allergy Chip */}
          {hasPenicillin ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] shadow-2xs">
              <AlertTriangleIcon className="w-4 h-4 text-[#ba1a1a]" />
              <span className="text-[12px] font-semibold">
                Allergies: Penicillin (Anaphylaxis Risk)
              </span>
            </div>
          ) : patient.allergies && patient.allergies.length > 0 ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
              <AlertTriangleIcon className="w-3.5 h-3.5" />
              <span className="text-[12px] font-medium">
                Allergies: {patient.allergies.join(", ")}
              </span>
            </div>
          ) : (
            <span className="text-[12px] text-[#565e74] px-2.5 py-1 rounded-full bg-[#eff4ff]">
              No Known Allergies
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#565e74]">
              Phone: {patient.phone}
            </span>
          </div>
        </div>

        {/* Live Triage Vitals Ribbon */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-1">
          <div className="px-3 py-1.5 rounded-lg bg-[#eff4ff] flex flex-col shrink-0">
            <span className="text-[10px] text-[#565e74] uppercase tracking-wider font-semibold">
              Blood Pressure
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[14px] font-bold text-[#0b1c30]">
                {vitals.bloodPressure || "120/80"}
              </span>
              <span className="text-[10px] text-[#565e74]">mmHg</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#eff4ff] flex flex-col shrink-0">
            <span className="text-[10px] text-[#565e74] uppercase tracking-wider font-semibold">
              Heart Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[14px] font-bold text-[#0b1c30]">
                {vitals.heartRate || 72}
              </span>
              <span className="text-[10px] text-[#565e74]">bpm</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#eff4ff] flex flex-col shrink-0">
            <span className="text-[10px] text-[#565e74] uppercase tracking-wider font-semibold">
              SpO2
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[14px] font-bold text-[#0b1c30]">
                {vitals.oxygenSaturation || 98}%
              </span>
              <span className="text-[10px] text-[#00873a] font-semibold">Normal</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#eff4ff] flex flex-col shrink-0">
            <span className="text-[10px] text-[#565e74] uppercase tracking-wider font-semibold">
              Temp
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[14px] font-bold text-[#0b1c30]">
                {vitals.temperature || 98.6}
              </span>
              <span className="text-[10px] text-[#565e74]">°F</span>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#eff4ff] flex flex-col shrink-0">
            <span className="text-[10px] text-[#565e74] uppercase tracking-wider font-semibold">
              Resp Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-[14px] font-bold text-[#0b1c30]">
                {vitals.respiratoryRate || 18}
              </span>
              <span className="text-[10px] text-[#565e74]">/min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Clinical Grid: Left (8 cols) + Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Clinical Assessment, History, Labs */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. Today's Nursing Assessment & Handoff */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <StethoscopeIcon className="w-5 h-5 text-[#006194]" />
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Today's Triage & Nursing Handoff
                </h2>
              </div>
              <span className="text-[12px] font-medium text-[#565e74] bg-white px-2.5 py-0.5 rounded-full border border-[#bfc7d2]/30">
                Logged by {nurseAssessment?.nurseName || "Arun Mary, RN"}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Reported Chief Complaint
                </span>
                <div className="p-3 bg-[#eff4ff]/50 rounded-lg text-[13px] text-[#0b1c30] font-medium border border-[#bfc7d2]/20">
                  {nurseAssessment?.chiefComplaint ||
                    todayVisit?.reason ||
                    "Routine follow-up evaluation and blood pressure monitoring."}
                </div>
              </div>

              {nurseAssessment?.doctorHandoffNotes && (
                <div>
                  <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                    Nurse Handoff Notes for Attending Doctor
                  </span>
                  <div className="p-3 bg-amber-50/60 rounded-lg text-[13px] text-amber-950 border border-amber-200/60">
                    {nurseAssessment.doctorHandoffNotes}
                  </div>
                </div>
              )}

              {nurseAssessment?.observations && (
                <div>
                  <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                    Clinical Observations
                  </span>
                  <p className="text-[13px] text-[#565e74] leading-relaxed">
                    {nurseAssessment.observations}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* 2. Previous Consultations */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <RecordsIcon className="w-5 h-5 text-[#006194]" />
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Previous Consultations & Clinical Encounters
                </h2>
              </div>
              <span className="text-[12px] text-[#565e74]">
                {previousConsultations.length} Encounters
              </span>
            </div>

            <div className="flex flex-col divide-y divide-[#bfc7d2]/20">
              {previousConsultations.length === 0 ? (
                <p className="py-4 text-center text-sm text-[#565e74]">
                  No past consultation records on file for this patient.
                </p>
              ) : (
                previousConsultations.map((v: any) => (
                  <div key={v._id} className="py-3.5 flex flex-col gap-1.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[14px] font-semibold text-[#0b1c30]">
                          {v.diagnosis || v.reason}
                        </span>
                        <span className="text-[12px] text-[#565e74] block">
                          {new Date(v.date).toLocaleDateString()} • {v.doctorName} ({v.specialty})
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                        Finalized
                      </span>
                    </div>
                    {v.summary && (
                      <p className="text-[12px] text-[#565e74] leading-relaxed bg-[#eff4ff]/30 p-2.5 rounded-lg border border-[#bfc7d2]/20">
                        {v.summary}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 3. Verified Pathology / Lab Reports */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <LabIcon className="w-5 h-5 text-[#006194]" />
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Verified Laboratory Diagnostics
                </h2>
              </div>
              <span className="text-[12px] text-[#00873a] font-semibold">
                Pathologist Verified
              </span>
            </div>

            <div className="flex flex-col divide-y divide-[#bfc7d2]/20">
              {verifiedLabReports.length === 0 ? (
                <p className="py-4 text-center text-sm text-[#565e74]">
                  No verified lab reports available.
                </p>
              ) : (
                verifiedLabReports.map((l: any) => (
                  <div key={l._id} className="py-3.5 flex flex-col gap-2 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[14px] font-semibold text-[#0b1c30]">
                          {l.testName}
                        </span>
                        <span className="text-[12px] text-[#565e74] block">
                          Verified on {l.verifiedDate ? new Date(l.verifiedDate).toLocaleDateString() : "Recently"} by {l.verifiedBy}
                        </span>
                      </div>
                      <Link
                        href={`/doctor/lab/${l._id}`}
                        className="text-[12px] font-semibold text-[#006194] hover:underline inline-flex items-center gap-0.5"
                      >
                        <span>View Parameters</span>
                        <ArrowForwardIcon className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <p className="text-[12px] text-[#565e74]">
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
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <PrescriptionsIcon className="w-5 h-5 text-[#006194]" />
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Prescriptions
                </h2>
              </div>
              <span className="text-[12px] font-semibold text-[#006194]">
                {prescriptions.length} Regimens
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {prescriptions.length === 0 ? (
                <p className="text-sm text-[#565e74]">
                  No active prescriptions authored.
                </p>
              ) : (
                prescriptions.slice(0, 3).map((rx: any) => (
                  <div
                    key={rx._id}
                    className="p-3 rounded-lg bg-[#eff4ff]/50 flex flex-col gap-1 border border-[#bfc7d2]/20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-[#0b1c30]">
                        {new Date(rx.date).toLocaleDateString()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#cce5ff] text-[#004b73]">
                        {rx.status?.toUpperCase() || "ACTIVE"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {rx.medications?.map((m: any, mIdx: number) => (
                        <div key={mIdx} className="text-[12px] text-[#0b1c30]">
                          • <strong className="font-semibold">{m.medicine}</strong> ({m.dosage}) — {m.frequency}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <Link
                href="/doctor/prescriptions"
                className="text-[12px] text-[#006194] font-semibold hover:underline mt-1 text-center"
              >
                View Complete Medication History →
              </Link>
            </div>
          </section>

          {/* Emergency & Insurance Info */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-3">
            <h3 className="text-[14px] font-bold text-[#0b1c30]">
              Patient Contact & Insurance
            </h3>
            <div className="text-[12px] text-[#565e74] flex flex-col gap-2">
              <div>
                <span className="text-[#8ca0be] uppercase tracking-wider text-[10px] block">
                  Emergency Contact
                </span>
                <span className="font-medium text-[#0b1c30]">
                  {patient.emergencyContact?.name || "Pooja K."} ({patient.emergencyContact?.relationship || "Spouse"})
                </span>
                <span className="block text-[#565e74]">
                  {patient.emergencyContact?.phone || "+1 (555) 987-6543"}
                </span>
              </div>
              <div className="pt-2 border-t border-[#bfc7d2]/20">
                <span className="text-[#8ca0be] uppercase tracking-wider text-[10px] block">
                  Insurance Provider
                </span>
                <span className="font-medium text-[#0b1c30]">
                  {patient.insurance?.provider || "Blue Cross Premium Health"}
                </span>
                <span className="block text-[#565e74]">
                  Policy: {patient.insurance?.policyNumber || "BC-98234-X"}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
