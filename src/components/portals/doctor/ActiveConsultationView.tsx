"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowBackIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PlusIcon,
  CloseIcon,
  SaveIcon,
  StethoscopeIcon,
  PrescriptionsIcon,
  LabIcon,
  FollowUpsIcon,
} from "./DoctorIcons";

interface MedicationItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface LabOrderItem {
  testName: string;
  reason: string;
  priority: "routine" | "urgent" | "stat";
  instructions?: string;
}

interface ActiveConsultationProps {
  id: string; // patientId or consultationId or queueId
}

export const ActiveConsultationView: React.FC<ActiveConsultationProps> = ({ id }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [addMedicineModalOpen, setAddMedicineModalOpen] = useState(false);
  const [addLabModalOpen, setAddLabModalOpen] = useState(false);

  // Form Fields
  const [patient, setPatient] = useState<any>(null);
  const [queue, setQueue] = useState<any>(null);
  const [nurseVitals, setNurseVitals] = useState<any>({});
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [historyOfPresentIllness, setHistoryOfPresentIllness] = useState("");
  const [clinicalExamination, setClinicalExamination] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [icdCode, setIcdCode] = useState("");
  const [differentialDiagnoses, setDifferentialDiagnoses] = useState<string[]>([]);
  const [newDifferential, setNewDifferential] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [labOrders, setLabOrders] = useState<LabOrderItem[]>([]);
  const [followUpNeeded, setFollowUpNeeded] = useState(true);
  const [followUpTimeframe, setFollowUpTimeframe] = useState("1 week");
  const [followUpInstructions, setFollowUpInstructions] = useState("");

  // New Medication modal form state
  const [newMed, setNewMed] = useState<MedicationItem>({
    medicine: "",
    dosage: "",
    frequency: "Once Daily",
    duration: "7 days",
    instructions: "",
  });

  // New Lab Order modal form state
  const [newLab, setNewLab] = useState<LabOrderItem>({
    testName: "",
    reason: "",
    priority: "routine",
    instructions: "",
  });

  useEffect(() => {
    async function loadConsultation() {
      try {
        const res = await fetch(`/api/doctor/consultations/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPatient(data.patient);
          setQueue(data.queue);
          setNurseVitals(data.nurseVitals || {});
          setChiefComplaint(data.chiefComplaint || "");
          setHistoryOfPresentIllness(data.historyOfPresentIllness || "");
          setClinicalExamination(data.clinicalExamination || "");
          setDiagnosis(data.diagnosis || "Non-cardiac Chest Pain / Atypical Angina");
          setIcdCode(data.icdCode || "R07.89");
          setDifferentialDiagnoses(data.differentialDiagnoses || []);
          setTreatmentPlan(data.treatmentPlan || "");
          setNotes(data.notes || "");
          setMedications(data.medications || []);
          setLabOrders(data.labOrders || []);
          if (data.followUp) {
            setFollowUpNeeded(data.followUp.needed !== false);
            setFollowUpTimeframe(data.followUp.timeframe || "1 week");
            setFollowUpInstructions(data.followUp.clinicalInstructions || "");
          }
        }
      } catch (err) {
        console.error("Failed to load consultation encounter:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConsultation();
  }, [id]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = {
        patientId: patient?._id,
        queueId: queue?._id,
        status: "draft",
        chiefComplaint,
        historyOfPresentIllness,
        clinicalExamination,
        diagnosis,
        icdCode,
        differentialDiagnoses,
        treatmentPlan,
        notes,
        medications,
        labOrders,
        followUp: {
          needed: followUpNeeded,
          timeframe: followUpTimeframe,
          recommendedDate: new Date(Date.now() + (followUpTimeframe.includes("2") ? 14 : 7) * 24 * 60 * 60 * 1000),
          reason: `Follow-up review for ${diagnosis}`,
          clinicalInstructions: followUpInstructions,
        },
        vitals: nurseVitals,
      };

      const res = await fetch(`/api/doctor/consultations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Consultation draft saved successfully.");
      } else {
        showToast("Failed to save draft.");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving consultation draft.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    try {
      const payload = {
        patientId: patient?._id,
        queueId: queue?._id,
        status: "completed",
        chiefComplaint,
        historyOfPresentIllness,
        clinicalExamination,
        diagnosis,
        icdCode,
        differentialDiagnoses,
        treatmentPlan,
        notes,
        medications,
        labOrders,
        followUp: {
          needed: followUpNeeded,
          timeframe: followUpTimeframe,
          recommendedDate: new Date(Date.now() + (followUpTimeframe.includes("2") ? 14 : 7) * 24 * 60 * 60 * 1000),
          reason: `Follow-up review for ${diagnosis}`,
          clinicalInstructions: followUpInstructions,
        },
        vitals: nurseVitals,
      };

      const res = await fetch(`/api/doctor/consultations/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFinalizeModalOpen(false);
        showToast("Consultation finalized and signed. Orders sent to Pharmacy & Lab.");
        setTimeout(() => {
          router.push("/doctor/queue");
        }, 1200);
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Failed to finalize consultation");
      }
    } catch (err) {
      console.error(err);
      alert("Error finalizing consultation");
    } finally {
      setSaving(false);
    }
  };

  const insertCardioTemplate = () => {
    const template =
      "Cardiovascular: S1, S2 present, regular rate and rhythm, no murmurs, gallops, or friction rubs heard. Peripheral pulses (radial, dorsalis pedis) 2+ bilateral equal.\nRespiratory: Bilateral lungs clear to auscultation, vesicular breath sounds throughout, no rales or wheezes.\nGeneral: Conscious, alert, pleasant, oriented x3, in no acute respiratory or hemodynamic distress.";
    setClinicalExamination(template);
  };

  const addDifferential = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (newDifferential.trim()) {
      setDifferentialDiagnoses([...differentialDiagnoses, newDifferential.trim()]);
      setNewDifferential("");
    }
  };

  const removeDifferential = (idx: number) => {
    setDifferentialDiagnoses(differentialDiagnoses.filter((_, i) => i !== idx));
  };

  const removeMedication = (idx: number) => {
    setMedications(medications.filter((_, i) => i !== idx));
  };

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMed.medicine.trim()) {
      setMedications([...medications, { ...newMed }]);
      setNewMed({
        medicine: "",
        dosage: "",
        frequency: "Once Daily",
        duration: "7 days",
        instructions: "",
      });
      setAddMedicineModalOpen(false);
    }
  };

  const removeLabOrder = (idx: number) => {
    setLabOrders(labOrders.filter((_, i) => i !== idx));
  };

  const handleAddLabOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLab.testName.trim()) {
      setLabOrders([...labOrders, { ...newLab }]);
      setNewLab({
        testName: "",
        reason: "",
        priority: "routine",
        instructions: "",
      });
      setAddLabModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006194] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-[#565e74]">
            Opening active consultation encounter...
          </span>
        </div>
      </div>
    );
  }

  const initials = patient?.name
    ? patient.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "PT";

  const hasPenicillin = patient?.allergies?.some((a: string) =>
    a.toLowerCase().includes("penicillin")
  );

  return (
    <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-10 right-8 z-50 flex items-center gap-3 px-4 py-3 bg-[#213145] text-white rounded-lg shadow-xl animate-fade-in">
          <CheckCircleIcon className="w-5 h-5 text-[#7ffc97]" />
          <span className="text-[13px] font-medium">{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR / NAVIGATION & ENCOUNTER ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
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
              {patient?.name || "Consultation"}
            </h1>
            <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] font-semibold border border-[#bfc7d2]/30">
              {patient?.mrn || "MRN-N/A"}
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#cce5ff] text-[#004b73]">
              <span className="w-2 h-2 rounded-full bg-[#006194] animate-pulse" />
              <span className="text-[11px] font-semibold">In Consultation</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            type="button"
            className="px-3.5 py-2 rounded-lg text-[13px] font-semibold text-[#0b1c30] bg-white border border-[#bfc7d2]/50 hover:bg-[#eff4ff] shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <SaveIcon className="w-4 h-4 text-[#565e74]" />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => setFinalizeModalOpen(true)}
            disabled={saving}
            type="button"
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#006194] hover:bg-[#007bb9] shadow-xs flex items-center gap-2 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>Complete Consultation</span>
          </button>
        </div>
      </div>

      {/* PATIENT SNAPSHOT BANNER */}
      <div className="w-full bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Demographics & Safety Chips */}
        <div className="flex flex-wrap items-center gap-4 min-w-0">
          <div className="flex items-center gap-3 pr-4 border-r border-[#bfc7d2]/30">
            <div className="w-11 h-11 rounded-full bg-[#dae2fd] text-[#131b2e] flex items-center justify-center font-bold text-base shrink-0">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-semibold text-[#0b1c30] leading-tight">
                {patient?.age} yrs • {patient?.gender}
              </span>
              <span className="text-[11px] text-[#565e74] leading-tight mt-0.5">
                Exam Room 04 • Visit 10:30 AM
              </span>
            </div>
          </div>

          {/* Allergy Chip */}
          {hasPenicillin ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ffdad6] text-[#ba1a1a]">
              <AlertTriangleIcon className="w-4 h-4 text-[#ba1a1a]" />
              <span className="text-[12px] font-bold">
                Allergies: Penicillin (Anaphylaxis Risk)
              </span>
            </div>
          ) : (
            <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#565e74]">
              Allergies: None documented
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#565e74]">
              Blood: {patient?.bloodGroup || "O+"}
            </span>
            <span className="text-[12px] px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#565e74]">
              Priority: {queue?.priority?.toUpperCase() || "NORMAL"}
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
                {nurseVitals.bloodPressure || "120/80"}
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
                {nurseVitals.heartRate || 72}
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
                {nurseVitals.oxygenSaturation || 98}%
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
                {nurseVitals.temperature || 98.6}
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
                {nurseVitals.respiratoryRate || 18}
              </span>
              <span className="text-[10px] text-[#565e74]">/min</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN 2-COLUMN CLINICAL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-16">
        {/* LEFT COLUMN: Clinical Documentation (65% width / 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* 1. Chief Complaint & HPI */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <StethoscopeIcon className="w-5 h-5 text-[#006194]" />
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Chief Complaint & Present Illness
                </h2>
              </div>
              <span className="text-[11px] font-medium text-[#565e74] bg-white px-2 py-0.5 rounded-full border border-[#bfc7d2]/30">
                Reported by Triage & Patient
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                Chief Reason for Encounter
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                className="w-full p-2.5 bg-[#eff4ff]/60 rounded-lg text-[13px] text-[#0b1c30] font-medium border border-[#bfc7d2]/30 focus:outline-none focus:bg-white focus:border-[#006194]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider text-[#565e74]">
                  Physician HPI (History of Present Illness)
                </label>
                <span className="text-[11px] text-[#8ca0be]">Auto-saving draft</span>
              </div>
              <textarea
                value={historyOfPresentIllness}
                onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
                rows={4}
                className="w-full p-3 bg-white border border-[#bfc7d2]/50 rounded-lg text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006194]/30 leading-relaxed transition-all"
                placeholder="Type clinical presentation, duration, radiation, triggers..."
              />
            </div>
          </section>

          {/* 2. Objective Clinical Examination */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#006194] text-white flex items-center justify-center text-[11px] font-bold">
                  OE
                </span>
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Objective Clinical Examination
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={insertCardioTemplate}
                  className="px-2.5 py-1 rounded text-[12px] font-semibold text-[#006194] bg-[#cce5ff] hover:bg-[#93ccff] transition-colors"
                >
                  + Normal Cardio Template
                </button>
                <button
                  type="button"
                  onClick={() => setClinicalExamination("")}
                  className="px-2 py-1 rounded text-[11px] text-[#565e74] hover:text-[#ba1a1a] transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={clinicalExamination}
              onChange={(e) => setClinicalExamination(e.target.value)}
              rows={5}
              className="w-full p-3 bg-white border border-[#bfc7d2]/50 rounded-lg text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006194]/30 leading-relaxed transition-all"
              placeholder="Document physical examination findings..."
            />
          </section>

          {/* 3. Diagnosis (Searchable & Structured) */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#006194] text-white flex items-center justify-center text-[11px] font-bold">
                  Dx
                </span>
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Diagnosis & Differentials (ICD-10)
                </h2>
              </div>
              <span className="text-[11px] text-[#565e74]">
                Verified coding index
              </span>
            </div>

            {/* Primary Diagnosis */}
            <div>
              <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1.5">
                Primary Clinical Diagnosis
              </label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#eff4ff]/60 border border-[#bfc7d2]/30">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#006194] text-white flex items-center justify-center text-[12px] font-bold">
                    1
                  </span>
                  <div>
                    <span className="text-[14px] font-bold text-[#0b1c30]">
                      {diagnosis}
                    </span>
                    <span className="ml-2 text-[11px] px-2 py-0.5 rounded bg-[#cce5ff] text-[#004b73] font-semibold">
                      ICD-10: {icdCode || "R07.89"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary & Differential Diagnoses */}
            <div>
              <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1.5">
                Secondary & Differential Diagnoses
              </label>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {differentialDiagnoses.map((diff, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#eff4ff] text-[#0b1c30] text-[12px] font-medium border border-[#bfc7d2]/30 shadow-2xs"
                  >
                    <span>{diff}</span>
                    <button
                      type="button"
                      onClick={() => removeDifferential(idx)}
                      className="text-[#565e74] hover:text-[#ba1a1a]"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Differential input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newDifferential}
                  onChange={(e) => setNewDifferential(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addDifferential(e)}
                  placeholder="+ Add Differential / ICD-10 Search (e.g. Costochondritis, Musculoskeletal)..."
                  className="flex-1 h-9 px-3 bg-[#eff4ff] border border-[#bfc7d2]/40 rounded-lg text-[12px] text-[#0b1c30] focus:outline-none focus:bg-white focus:border-[#006194]"
                />
                <button
                  type="button"
                  onClick={addDifferential}
                  className="h-9 px-3 rounded-lg bg-[#006194] text-white text-[12px] font-semibold hover:bg-[#007bb9]"
                >
                  Add
                </button>
              </div>
            </div>
          </section>

          {/* 4. Treatment Plan & Patient Guidance */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#006194] text-white flex items-center justify-center text-[11px] font-bold">
                  Rx
                </span>
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Treatment Plan & Patient Guidance
                </h2>
              </div>
              <span className="text-[11px] text-[#565e74]">
                Printed on Consultation Summary
              </span>
            </div>

            <textarea
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              rows={5}
              className="w-full p-3 bg-white border border-[#bfc7d2]/50 rounded-lg text-[13px] text-[#0b1c30] focus:outline-none focus:ring-2 focus:ring-[#006194]/30 leading-relaxed transition-all"
              placeholder="Specify instructions, lifestyle guidelines, red-flag protocols..."
            />
          </section>
        </div>

        {/* RIGHT COLUMN: Orders, Prescriptions, Follow-up (35% width / 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* 5. Prescription Builder */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <PrescriptionsIcon className="w-5 h-5 text-[#006194]" />
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Prescription
                </h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#cce5ff] text-[#004b73]">
                {medications.length} Medicines
              </span>
            </div>

            {/* Allergy Safety Badge */}
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-medium leading-tight">
                Allergy Check: Verified Safe (No Beta-Lactam class ordered).
              </span>
            </div>

            {/* Medicine Cards */}
            <div className="flex flex-col gap-2.5">
              {medications.length === 0 ? (
                <p className="text-[12px] text-[#565e74] italic text-center py-2">
                  No medications added.
                </p>
              ) : (
                medications.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#eff4ff]/50 rounded-lg flex flex-col gap-1 border border-[#bfc7d2]/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[13px] font-semibold text-[#0b1c30]">
                          {m.medicine}
                        </span>
                        <span className="text-[11px] text-[#565e74] block">
                          {m.dosage} • {m.frequency}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMedication(idx)}
                        className="text-[#565e74] hover:text-[#ba1a1a] p-1"
                        title="Remove medicine"
                      >
                        <CloseIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[#565e74] text-[11px]">
                      <span className="px-1.5 py-0.5 bg-white rounded border border-[#bfc7d2]/30">
                        Duration: {m.duration}
                      </span>
                    </div>
                    {m.instructions && (
                      <p className="text-[11px] text-[#565e74] mt-1 bg-white p-2 rounded border border-[#bfc7d2]/20 italic">
                        "{m.instructions}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setAddMedicineModalOpen(true)}
              className="w-full py-2 rounded-lg text-[12px] font-semibold text-[#006194] bg-[#eff4ff] hover:bg-[#cce5ff] transition-colors flex items-center justify-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
          </section>

          {/* 6. Lab & Diagnostic Orders */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <LabIcon className="w-5 h-5 text-[#006194]" />
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Lab & Diagnostic Orders
                </h2>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#cce5ff] text-[#004b73]">
                {labOrders.length} Orders
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {labOrders.length === 0 ? (
                <p className="text-[12px] text-[#565e74] italic text-center py-2">
                  No diagnostic tests requested.
                </p>
              ) : (
                labOrders.map((order, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#eff4ff]/50 rounded-lg flex items-start justify-between gap-2 border border-[#bfc7d2]/30"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#0b1c30]">
                          {order.testName}
                        </span>
                        {order.priority === "urgent" || order.priority === "stat" ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a]">
                            Urgent
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white text-[#565e74] border border-[#bfc7d2]/30">
                            Routine
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#565e74] mt-0.5">
                        Reason: {order.reason}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLabOrder(idx)}
                      className="text-[#565e74] hover:text-[#ba1a1a]"
                    >
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <p className="text-[11px] text-[#8ca0be] italic">
              Dispatches directly to Lab Technician queue.
            </p>

            <button
              type="button"
              onClick={() => setAddLabModalOpen(true)}
              className="w-full py-2 rounded-lg text-[12px] font-semibold text-[#006194] bg-[#eff4ff] hover:bg-[#cce5ff] transition-colors flex items-center justify-center gap-1"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Request Diagnostic Test</span>
            </button>
          </section>

          {/* 7. Follow-up Scheduling */}
          <section className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 bg-[#eff4ff]/60 -mx-5 -mt-5 p-4 rounded-t-xl border-b border-[#bfc7d2]/20">
              <div className="flex items-center gap-2">
                <FollowUpsIcon className="w-5 h-5 text-[#006194]" />
                <h2 className="text-[15px] font-bold text-[#0b1c30]">
                  Follow-up Scheduling
                </h2>
              </div>
              <span className="text-[11px] text-[#565e74]">
                Reception Queue
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#0b1c30]">
                <input
                  type="radio"
                  name="followup"
                  checked={!followUpNeeded}
                  onChange={() => setFollowUpNeeded(false)}
                  className="w-4 h-4 text-[#006194]"
                />
                <span>No follow-up needed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#0b1c30]">
                <input
                  type="radio"
                  name="followup"
                  checked={followUpNeeded && followUpTimeframe === "1 week"}
                  onChange={() => {
                    setFollowUpNeeded(true);
                    setFollowUpTimeframe("1 week");
                  }}
                  className="w-4 h-4 text-[#006194]"
                />
                <span>Follow-up in 1 week (Cardiac Biomarker & ECG review)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[13px] text-[#0b1c30]">
                <input
                  type="radio"
                  name="followup"
                  checked={followUpNeeded && followUpTimeframe === "2 weeks"}
                  onChange={() => {
                    setFollowUpNeeded(true);
                    setFollowUpTimeframe("2 weeks");
                  }}
                  className="w-4 h-4 text-[#006194]"
                />
                <span>Follow-up in 2 weeks</span>
              </label>

              {followUpNeeded && (
                <div className="mt-2 flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
                    Instructions for Receptionist
                  </label>
                  <input
                    type="text"
                    value={followUpInstructions}
                    onChange={(e) => setFollowUpInstructions(e.target.value)}
                    placeholder="Book 20-min consultation slot with Dr. Anil Kumar..."
                    className="w-full h-8 px-2.5 bg-[#eff4ff] border border-[#bfc7d2]/40 rounded-lg text-[12px] text-[#0b1c30] focus:outline-none focus:bg-white focus:border-[#006194]"
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* FINALIZE CONSULTATION MODAL */}
      {finalizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-5 border border-[#bfc7d2]/40">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[#cce5ff] flex items-center justify-center shrink-0 text-[#006194]">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-lg font-bold text-[#0b1c30]">
                  Complete this consultation?
                </h3>
                <p className="text-[13px] text-[#565e74] leading-relaxed">
                  Make sure the diagnosis, treatment plan, and required diagnostic orders are verified. Once finalized, this clinical encounter will be signed by Dr. Anil Kumar, committed to {patient?.name}'s electronic health record, and transmitted to Pharmacy and Laboratory.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#eff4ff] rounded-lg flex flex-col gap-2 text-[12px]">
              <div className="flex justify-between items-center text-[#565e74]">
                <span className="uppercase tracking-wider font-semibold">Patient</span>
                <span className="font-bold text-[#0b1c30]">{patient?.name} ({patient?.mrn})</span>
              </div>
              <div className="flex justify-between items-center text-[#565e74]">
                <span className="uppercase tracking-wider font-semibold">Primary Diagnosis</span>
                <span className="font-semibold text-[#006194]">{diagnosis} ({icdCode})</span>
              </div>
              <div className="flex justify-between items-center text-[#565e74]">
                <span className="uppercase tracking-wider font-semibold">Prescriptions Queued</span>
                <span className="font-medium text-[#0b1c30]">{medications.length} Medicines</span>
              </div>
              <div className="flex justify-between items-center text-[#565e74]">
                <span className="uppercase tracking-wider font-semibold">Diagnostic Orders</span>
                <span className="font-medium text-[#0b1c30]">{labOrders.length} Tests</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFinalizeModalOpen(false)}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-[#565e74] bg-[#eff4ff] hover:bg-[#dce9ff] transition-colors"
              >
                Cancel & Continue Editing
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white bg-[#006194] hover:bg-[#007bb9] shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Confirm & Finalize</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEDICATION MODAL */}
      {addMedicineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4 border border-[#bfc7d2]/40">
            <div className="flex items-center justify-between pb-2 border-b border-[#bfc7d2]/30">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Add Medication to Regimen
              </h3>
              <button
                type="button"
                onClick={() => setAddMedicineModalOpen(false)}
                className="text-[#565e74] hover:text-[#ba1a1a]"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Medicine Name & Strength *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atorvastatin 20mg or Metoprolol 25mg"
                  value={newMed.medicine}
                  onChange={(e) => setNewMed({ ...newMed, medicine: e.target.value })}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    placeholder="1 tablet"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                    Frequency
                  </label>
                  <select
                    value={newMed.frequency}
                    onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                    className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[12px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                  >
                    <option value="Once Daily (Morning)">Once Daily (Morning)</option>
                    <option value="Once Daily (Night)">Once Daily (Night)</option>
                    <option value="Twice Daily (BID)">Twice Daily (BID)</option>
                    <option value="Three Times Daily (TID)">Three Times Daily (TID)</option>
                    <option value="PRN (As Needed)">PRN (As Needed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Duration
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7 days, 14 days, 30 days"
                  value={newMed.duration}
                  onChange={(e) => setNewMed({ ...newMed, duration: e.target.value })}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Special Instructions
                </label>
                <input
                  type="text"
                  placeholder="Take after meals with plenty of water"
                  value={newMed.instructions}
                  onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#bfc7d2]/30">
                <button
                  type="button"
                  onClick={() => setAddMedicineModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-[#565e74] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-[#006194] hover:bg-[#007bb9]"
                >
                  Add to Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD LAB ORDER MODAL */}
      {addLabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4 border border-[#bfc7d2]/40">
            <div className="flex items-center justify-between pb-2 border-b border-[#bfc7d2]/30">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Request Diagnostic Test
              </h3>
              <button
                type="button"
                onClick={() => setAddLabModalOpen(false)}
                className="text-[#565e74] hover:text-[#ba1a1a]"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLabOrder} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Test Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2D Echocardiogram, Complete Blood Count, HbA1c"
                  value={newLab.testName}
                  onChange={(e) => setNewLab({ ...newLab, testName: e.target.value })}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Clinical Indication / Reason
                </label>
                <input
                  type="text"
                  placeholder="e.g. Evaluate ST-T elevation; risk stratification"
                  value={newLab.reason}
                  onChange={(e) => setNewLab({ ...newLab, reason: e.target.value })}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Priority
                </label>
                <select
                  value={newLab.priority}
                  onChange={(e) => setNewLab({ ...newLab, priority: e.target.value as any })}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[12px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                >
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent (Today)</option>
                  <option value="stat">STAT (Immediate Phlebotomy)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Technician Instructions
                </label>
                <input
                  type="text"
                  placeholder="Fasting sample required; notify doctor on verification"
                  value={newLab.instructions}
                  onChange={(e) => setNewLab({ ...newLab, instructions: e.target.value })}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#bfc7d2]/30">
                <button
                  type="button"
                  onClick={() => setAddLabModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-[#565e74] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-[#006194] hover:bg-[#007bb9]"
                >
                  Queue Lab Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
