"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PatientsIcon,
  VerifiedIcon,
  ReportsIcon,
  CheckCircleIcon,
} from "./PathologistIcons";

interface PatientDetailViewProps {
  patientId: string;
}

export function PatientDetailView({ patientId }: PatientDetailViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPatientDetail() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/pathologist/patients/${patientId}`);
        if (!res.ok) throw new Error("Failed to load patient pathology history.");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load patient history.");
      } finally {
        setLoading(false);
      }
    }
    fetchPatientDetail();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex-1 p-10 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Aggregating longitudinal patient lab history...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 p-10 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md">
          <p className="text-sm font-bold text-red-800">Error Loading Profile</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <Link
            href="/pathologist/patients"
            className="mt-4 inline-block px-4 py-2 bg-[#00355f] text-white rounded-xl text-xs font-semibold"
          >
            Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  const { patient, reports } = data;

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-8 max-w-6xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/pathologist/dashboard" className="hover:text-[#00355f]">
            Pathology
          </Link>
          <span>/</span>
          <Link href="/pathologist/patients" className="hover:text-[#00355f]">
            Patients
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{patient.name}</span>
        </div>

        <Link
          href="/pathologist/patients"
          className="text-xs font-semibold text-slate-600 hover:text-[#00355f] flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Patient Roster</span>
        </Link>
      </div>

      {/* Patient Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#00355f] text-[#94f2ef] flex items-center justify-center font-bold text-xl">
              {patient.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#002444] tracking-tight">{patient.name}</h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                MRN: {patient.mrn} • Contact: {patient.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
              {reports.length} Total Laboratory Studies
            </span>
          </div>
        </div>

        {/* Demographics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Date of Birth</span>
            <span className="text-slate-800 font-medium">
              {patient.dob ? new Date(patient.dob).toLocaleDateString() : "N/A"}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender &amp; Blood</span>
            <span className="text-slate-800 font-medium capitalize">
              {patient.gender} • {patient.bloodGroup}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Known Allergies</span>
            <span className="text-slate-800 font-medium">
              {patient.allergies?.length > 0 ? patient.allergies.join(", ") : "None reported (NKDA)"}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Emergency Contact</span>
            <span className="text-slate-800 font-medium">
              {patient.emergencyContact?.name || "Family Contact"}
            </span>
          </div>
        </div>
      </div>

      {/* Longitudinal Test History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#002444]">
          Longitudinal Diagnostic Studies &amp; Interpretations
        </h2>

        {reports.length === 0 ? (
          <div className="p-10 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
            No laboratory studies on record for this patient.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r: any) => {
              const isVerified = r.status === "verified" || r.status === "finalized";

              return (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{r.testName}</h3>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">{r.department}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Sample ID: <span className="font-mono text-slate-600">{r.sampleId}</span> • Ordered by {r.doctorName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isVerified ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                          Certified ({new Date(r.verifiedDate).toLocaleDateString()})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                          {r.status.replace(/_/g, " ").toUpperCase()}
                        </span>
                      )}

                      {isVerified ? (
                        <Link
                          href={`/pathologist/verified/${r.id}`}
                          className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
                        >
                          View Certificate
                        </Link>
                      ) : (
                        <Link
                          href={`/pathologist/reports/${r.id}`}
                          className="px-3 py-1 rounded-lg bg-[#00355f] text-white hover:bg-[#002444] text-xs font-semibold"
                        >
                          Review &amp; Certify
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Parameter Results Snippet */}
                  {r.results && r.results.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {r.results.slice(0, 4).map((p: any, idx: number) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 text-[10px] block truncate">{p.parameter}</span>
                          <span className="font-bold text-slate-900 font-mono text-xs">{p.value} {p.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Diagnostic Interpretation Snippet */}
                  {r.pathologistInterpretation && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
                      <strong className="text-slate-900 not-italic">Pathologist Impression: </strong>
                      &quot;{r.pathologistInterpretation}&quot;
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
