"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  HeartPulseIcon,
  AssessmentIcon,
  AlertTriangleIcon,
} from "./NurseIcons";

interface NursingRecordDetailProps {
  recordId: string;
}

export const NursingRecordDetailView: React.FC<NursingRecordDetailProps> = ({ recordId }) => {
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecord() {
      try {
        setLoading(true);
        const res = await fetch(`/api/nurse/records/${recordId}`);
        if (!res.ok) throw new Error("Failed to load nursing record");
        const json = await res.json();
        setRecord(json.record);
      } catch (err: any) {
        setError(err.message || "Failed to load record");
      } finally {
        setLoading(false);
      }
    }
    if (recordId) {
      loadRecord();
    }
  }, [recordId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006a61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Record Archive...</span>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 max-w-xl mx-auto mt-8">
        <h3 className="font-semibold text-base mb-1">Record Not Found</h3>
        <p className="text-sm mb-4">{error || "Could not retrieve nursing archive record."}</p>
        <Link
          href="/nurse/records"
          className="px-4 py-2 rounded-lg bg-[#00355f] text-white text-xs font-semibold inline-block"
        >
          Return to Records Archive
        </Link>
      </div>
    );
  }

  const pat = record.patientId;
  const patName = `${pat?.firstName || ""} ${pat?.lastName || pat?.userId?.name || "Patient"}`;
  const v = record.vitals || {};
  const isFinal = record.status === "completed";

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
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
              <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">
                Nursing Record #{record._id.slice(-6).toUpperCase()}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isFinal
                    ? "bg-teal-50 text-teal-800 border border-teal-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {record.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged on {new Date(record.createdAt).toLocaleString()} by{" "}
              <strong className="text-slate-800">{record.nurseName || "Arun Mary, RN"}</strong>
            </p>
          </div>
        </div>

        {isFinal && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
            <CheckCircleIcon size={14} className="text-teal-600" />
            <span>Immutable Final Record</span>
          </div>
        )}
      </div>

      {/* PATIENT DEMOGRAPHICS STRIP */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Patient Identity</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-bold text-slate-900 text-sm">{patName}</span>
            <span className="font-mono text-xs text-slate-500">({pat?.mrn || "MRN-1002"})</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Demographics</span>
          <span className="text-xs text-slate-700 block mt-0.5">
            {pat?.gender || "Female"} • Blood Group: <strong className="text-slate-900">{pat?.bloodGroup || "O+"}</strong>
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Allergies</span>
          <div className="flex gap-1 mt-0.5">
            {pat?.allergies && pat.allergies.length > 0 ? (
              pat.allergies.map((alg: string) => (
                <span key={alg} className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                  {alg}
                </span>
              ))
            ) : (
              <span className="text-slate-500 text-xs">NKDA</span>
            )}
          </div>
        </div>

        <div>
          <Link
            href={`/nurse/patients/${pat?._id}`}
            className="text-xs font-semibold text-[#006a61] hover:underline"
          >
            Open Patient Chart →
          </Link>
        </div>
      </div>

      {/* VITALS RECORD CARD */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
        <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
          <HeartPulseIcon size={16} className="text-[#006a61]" />
          <span>Recorded Vital Signs</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">BP</span>
            <span className="text-lg font-bold text-slate-900">{v.bloodPressure || "120/80"}</span>
            <span className="text-[10px] text-slate-500 block">mmHg</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Heart Rate</span>
            <span className="text-lg font-bold text-slate-900">{v.heartRate || 72}</span>
            <span className="text-[10px] text-slate-500 block">bpm</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">SpO2</span>
            <span className="text-lg font-bold text-slate-900">{v.oxygenSaturation || 98}%</span>
            <span className="text-[10px] text-slate-500 block">Room Air</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Temperature</span>
            <span className="text-lg font-bold text-slate-900">{v.temperature || 98.6}°F</span>
            <span className="text-[10px] text-slate-500 block">Afebrile</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Resp. Rate</span>
            <span className="text-lg font-bold text-slate-900">{v.respiratoryRate || 16}</span>
            <span className="text-[10px] text-slate-500 block">/min</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Pain Score</span>
            <span className="text-lg font-bold text-slate-900">{v.painScore || 0}/10</span>
            <span className="text-[10px] text-slate-500 block">Wong-Baker</span>
          </div>
        </div>
      </div>

      {/* ASSESSMENT DETAILS */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4">
        <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center gap-2">
          <AssessmentIcon size={16} className="text-[#00355f]" />
          <span>Clinical Triage Notes &amp; Observations</span>
        </h3>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Chief Complaint
          </span>
          <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg font-medium">
            {record.chiefComplaint}
          </p>
        </div>

        {record.symptoms && record.symptoms.length > 0 && (
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
              Reported Symptoms
            </span>
            <div className="flex flex-wrap gap-1.5">
              {record.symptoms.map((s: string) => (
                <span key={s} className="px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Clinical Observations
          </span>
          <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-lg leading-relaxed">
            {record.observations}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Condition</span>
            <span className="font-bold capitalize text-slate-800">{record.condition}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobility</span>
            <span className="font-bold capitalize text-slate-800">{record.mobility}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Triage Priority</span>
            <span className="font-bold capitalize text-rose-600">{record.triagePriority}</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
            Doctor Handoff Briefing
          </span>
          <p className="text-xs text-slate-800 bg-teal-50/60 border border-teal-100 p-3 rounded-lg leading-relaxed">
            {record.doctorHandoffNotes || "No specific handoff remarks."}
          </p>
        </div>
      </div>
    </div>
  );
};
