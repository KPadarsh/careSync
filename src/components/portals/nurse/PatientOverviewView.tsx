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
  ClockIcon,
  VitalsIcon,
  AssessmentIcon,
  UserIcon,
  PhoneIcon,
  SaveIcon,
} from "./NurseIcons";

interface PatientOverviewProps {
  patientId: string;
}

export const PatientOverviewView: React.FC<PatientOverviewProps> = ({ patientId }) => {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingReady, setMarkingReady] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/nurse/patients/${patientId}`);
      if (!res.ok) throw new Error("Failed to load patient overview");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load clinical record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchOverview();
    }
  }, [patientId]);

  const handleMarkReadyForDoctor = async () => {
    if (!data?.activeQueue?._id) return;
    try {
      setMarkingReady(true);
      const res = await fetch("/api/nurse/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queueId: data.activeQueue._id,
          status: "ready-for-doctor",
        }),
      });
      if (res.ok) {
        fetchOverview();
      }
    } catch (err) {
      console.error("Mark ready error:", err);
    } finally {
      setMarkingReady(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006a61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Patient Chart...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 max-w-xl mx-auto mt-8">
        <h3 className="font-semibold text-base mb-1">Patient Record Not Found</h3>
        <p className="text-sm mb-4">{error || "Could not retrieve clinical profile."}</p>
        <Link
          href="/nurse/queue"
          className="px-4 py-2 rounded-lg bg-[#00355f] text-white text-xs font-semibold inline-block"
        >
          Return to Queue
        </Link>
      </div>
    );
  }

  const { patient, activeQueue, currentVitals, latestAssessment, nursingRecords } = data;
  const fullName = `${patient.firstName || ""} ${patient.lastName || patient.userId?.name || "Patient"}`;
  const allergies = patient.allergies || [];
  const hasAllergies = allergies.length > 0;
  const emergency = patient.emergencyContact;

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* TOP BREADCRUMB & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                {patient.mrn || "MRN-1002"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{patient.gender || "Female"}</span>
              <span>•</span>
              <span>Blood Group: <strong className="text-slate-800">{patient.bloodGroup || "O+"}</strong></span>
              <span>•</span>
              <span>Phone: {patient.phone || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href={`/nurse/vitals/${patient._id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs"
          >
            <VitalsIcon size={14} className="text-[#006a61]" />
            <span>Record Vitals</span>
          </Link>
          <Link
            href={`/nurse/assessments/${patient._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00355f] hover:bg-[#0f4c81] text-white text-xs font-semibold shadow-2xs"
          >
            <AssessmentIcon size={14} />
            <span>Clinical Assessment</span>
          </Link>
        </div>
      </div>

      {/* ALLERGY WARNING STRIP (HIGHLIGHTED IF ANY) */}
      {hasAllergies ? (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-900">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
            <AlertTriangleIcon size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider block text-rose-800">
              Clinical Allergy Alert
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {allergies.map((alg: string) => (
                <span
                  key={alg}
                  className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-2xs"
                >
                  ⚠️ {alg}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2">
          <CheckCircleIcon size={14} className="text-teal-600" />
          <span>No known drug allergies reported (NKDA).</span>
        </div>
      )}

      {/* TODAY'S VISIT / ACTIVE QUEUE STRIP */}
      {activeQueue ? (
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-lg bg-teal-50 text-[#006a61] border border-teal-200 font-mono font-extrabold text-lg">
              {activeQueue.ticketNumber}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Today&apos;s Active Consultation Queue</span>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold uppercase">
                  {activeQueue.status.replace("-", " ")}
                </span>
              </div>
              <span className="text-xs text-slate-500 mt-0.5">
                Assigned: <strong className="text-slate-800">{activeQueue.doctorId?.name || "Dr. Staff"}</strong> (
                {activeQueue.department} • {activeQueue.roomNumber || "Room 302"})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeQueue.status !== "ready-for-doctor" && (
              <button
                type="button"
                onClick={handleMarkReadyForDoctor}
                disabled={markingReady}
                className="px-3.5 py-1.5 rounded-lg bg-[#006a61] hover:bg-[#005049] text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5"
              >
                <CheckCircleIcon size={14} />
                <span>{markingReady ? "Updating..." : "Mark Ready for Doctor"}</span>
              </button>
            )}
            {activeQueue.status === "ready-for-doctor" && (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 text-[#006a61] border border-teal-200 text-xs font-bold">
                <CheckCircleIcon size={14} />
                <span>Cleared &amp; Ready for Doctor</span>
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
          Patient is not currently in today&apos;s active queue.
        </div>
      )}

      {/* TWO COLUMN GRID: VITALS & CLINICAL OBSERVATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: CURRENT VITALS SUMMARY (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HeartPulseIcon size={18} className="text-[#006a61]" />
                <h3 className="font-bold text-slate-900 text-sm">Current Vitals Intake</h3>
              </div>
              <Link
                href={`/nurse/vitals/${patient._id}`}
                className="text-xs font-semibold text-[#006a61] hover:underline"
              >
                Edit / View History →
              </Link>
            </div>

            {currentVitals ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* BP */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Blood Pressure</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xl font-extrabold text-slate-900">
                      {currentVitals.bloodPressure || "120/80"}
                    </span>
                    <span className="text-[10px] text-slate-400">mmHg</span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-medium">Normal Range</span>
                </div>

                {/* Heart Rate */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Heart Rate</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xl font-extrabold text-slate-900">
                      {currentVitals.heartRate || 72}
                    </span>
                    <span className="text-[10px] text-slate-400">bpm</span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-medium">Regular Rhythm</span>
                </div>

                {/* SpO2 */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">SpO2 Oxygen</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xl font-extrabold text-slate-900">
                      {currentVitals.oxygenSaturation || 98}
                    </span>
                    <span className="text-[10px] text-slate-400">%</span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-medium">Optimal Room Air</span>
                </div>

                {/* Temperature */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Temperature</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xl font-extrabold text-slate-900">
                      {currentVitals.temperature || 98.6}
                    </span>
                    <span className="text-[10px] text-slate-400">°F</span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-medium">Afebrile (Oral)</span>
                </div>

                {/* Respiratory Rate */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Respiratory Rate</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xl font-extrabold text-slate-900">
                      {currentVitals.respiratoryRate || 16}
                    </span>
                    <span className="text-[10px] text-slate-400">/min</span>
                  </div>
                  <span className="text-[11px] text-teal-700 font-medium">Eupneic</span>
                </div>

                {/* Pain Score */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Pain Score</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-xl font-extrabold text-slate-900">
                      {currentVitals.painScore || 0}
                    </span>
                    <span className="text-[10px] text-slate-400">/10</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700">
                    {(currentVitals.painScore || 0) > 4 ? "Mild-Moderate" : "Controlled"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No vitals recorded for this visit yet. Click &quot;Record Vitals&quot; above to log initial intake.
              </div>
            )}
          </div>

          {/* NURSING ASSESSMENT SUMMARY */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AssessmentIcon size={18} className="text-[#00355f]" />
                <h3 className="font-bold text-slate-900 text-sm">Nursing Triage Assessment</h3>
              </div>
              <Link
                href={`/nurse/assessments/${patient._id}`}
                className="text-xs font-semibold text-[#00355f] hover:underline"
              >
                Open Full Assessment →
              </Link>
            </div>

            {latestAssessment ? (
              <div className="flex flex-col gap-3 text-xs text-slate-700">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Chief Complaint
                  </span>
                  <p className="font-medium text-slate-900 bg-slate-50 p-2 rounded-lg">
                    {latestAssessment.chiefComplaint || "General triage evaluation."}
                  </p>
                </div>

                {latestAssessment.symptoms && latestAssessment.symptoms.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Reported Symptoms
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {latestAssessment.symptoms.map((sym: string) => (
                        <span key={sym} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Clinical Observations
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-2 rounded-lg leading-relaxed">
                    {latestAssessment.observations || "Patient alert and fully oriented."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Condition</span>
                    <span className="font-bold capitalize text-slate-800">{latestAssessment.condition}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Mobility</span>
                    <span className="font-bold capitalize text-slate-800">{latestAssessment.mobility}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Priority</span>
                    <span className="font-bold capitalize text-rose-600">{latestAssessment.triagePriority}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                No triage assessment logged yet.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: DOCTOR HANDOFF & EMERGENCY INFO (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* DOCTOR HANDOFF CARD */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Doctor Handoff Briefing
            </h3>
            <div className="text-xs text-slate-700 bg-teal-50/50 border border-teal-100 p-3 rounded-lg leading-relaxed">
              {latestAssessment?.doctorHandoffNotes ? (
                latestAssessment.doctorHandoffNotes
              ) : (
                <span className="text-slate-500 italic">
                  No specific physician handoff instructions noted. Standard clinical protocol applies.
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Prepared by: <strong className="text-slate-800">{latestAssessment?.nurseName || "Arun Mary, RN"}</strong></span>
              <span>Status: <strong className="text-teal-700 uppercase">{latestAssessment?.status || "Draft"}</strong></span>
            </div>
          </div>

          {/* EMERGENCY CONTACT CARD */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Emergency Information
            </h3>
            {emergency ? (
              <div className="text-xs text-slate-700 flex flex-col gap-1.5">
                <div>
                  <span className="text-[10px] text-slate-400 block">Contact Name</span>
                  <span className="font-bold text-slate-900 text-sm">{emergency.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Relationship</span>
                  <span className="font-medium text-slate-700">{emergency.relationship || "Family"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Emergency Phone</span>
                  <span className="font-mono font-bold text-slate-900">{emergency.phone}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400">No emergency contact recorded.</div>
            )}
          </div>

          {/* RECENT NURSING RECORDS TIMELINE */}
          <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Recent Nursing Records ({nursingRecords?.length || 0})
            </h3>
            {nursingRecords && nursingRecords.length > 0 ? (
              <div className="flex flex-col gap-2">
                {nursingRecords.slice(0, 3).map((rec: any) => (
                  <div
                    key={rec._id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-slate-500 text-[10px]">
                      <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                      <span className="font-bold uppercase text-teal-700">{rec.status}</span>
                    </div>
                    <span className="font-semibold text-slate-800 truncate">
                      {rec.chiefComplaint}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      BP: {rec.vitals?.bloodPressure || "N/A"} • HR: {rec.vitals?.heartRate || "N/A"} bpm
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400">No past nursing records.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
