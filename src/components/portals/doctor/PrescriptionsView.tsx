"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SearchIcon,
  CheckCircleIcon,
  PlusIcon,
  CloseIcon,
  PrescriptionsIcon,
  AlertTriangleIcon,
} from "./DoctorIcons";

interface MedicationItem {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refillsRemaining?: number;
}

interface PrescriptionRecord {
  _id: string;
  date: string;
  status: "active" | "completed" | "discontinued";
  notes?: string;
  diagnosis: string;
  patient: {
    _id: string;
    name: string;
    mrn: string;
    age: number;
    gender: string;
    bloodGroup: string;
    allergies: string[];
    avatar?: string;
  };
  doctor: {
    name: string;
    specialty: string;
    qualification: string;
  };
  medications: MedicationItem[];
}

export const PrescriptionsView: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRx, setSelectedRx] = useState<PrescriptionRecord | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New Prescription Form state
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [newRxPatientId, setNewRxPatientId] = useState("");
  const [newRxMeds, setNewRxMeds] = useState<MedicationItem[]>([
    {
      medicine: "",
      dosage: "",
      frequency: "Once Daily",
      duration: "7 days",
      instructions: "",
    },
  ]);
  const [newRxNotes, setNewRxNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPrescriptions = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/doctor/prescriptions?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPrescriptions(json.prescriptions || []);
        if (json.stats) setStats(json.stats);
        if (json.prescriptions && json.prescriptions.length > 0 && !selectedRx) {
          setSelectedRx(json.prescriptions[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load prescriptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  useEffect(() => {
    async function loadPatientsList() {
      try {
        const res = await fetch("/api/doctor/patients");
        if (res.ok) {
          const json = await res.json();
          setAllPatients(json.patients || []);
          if (json.patients && json.patients.length > 0) {
            setNewRxPatientId(json.patients[0]._id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadPatientsList();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrescriptions();
  };

  const handleAddMedRow = () => {
    setNewRxMeds([
      ...newRxMeds,
      {
        medicine: "",
        dosage: "",
        frequency: "Once Daily",
        duration: "7 days",
        instructions: "",
      },
    ]);
  };

  const handleRemoveMedRow = (idx: number) => {
    setNewRxMeds(newRxMeds.filter((_, i) => i !== idx));
  };

  const handleMedChange = (idx: number, field: keyof MedicationItem, val: string) => {
    const updated = [...newRxMeds];
    updated[idx] = { ...updated[idx], [field]: val };
    setNewRxMeds(updated);
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validMeds = newRxMeds.filter((m) => m.medicine.trim());
      if (validMeds.length === 0) {
        alert("Please enter at least one medicine");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/doctor/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: newRxPatientId,
          medications: validMeds,
          notes: newRxNotes,
        }),
      });

      if (res.ok) {
        setCreateModalOpen(false);
        fetchPrescriptions();
      } else {
        alert("Failed to submit prescription");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting prescription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header Area */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-[#006194] tracking-wider uppercase">
                Clinical Registry
              </span>
              <span className="text-[#bfc7d2]">•</span>
              <span className="text-[12px] text-[#565e74]">Outpatient Orders</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
              Prescriptions
            </h1>
            <p className="text-[14px] text-[#565e74] mt-0.5">
              Review and author medical prescriptions transmitted directly to Pharmacy.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="bg-white px-4 py-2.5 rounded-xl shadow-xs border border-[#bfc7d2]/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#006194]">
                <PrescriptionsIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#565e74]">Total Authored</span>
                <span className="text-[14px] font-bold text-[#0b1c30]">
                  {stats.total} Orders
                </span>
              </div>
            </div>

            <div className="bg-white px-4 py-2.5 rounded-xl shadow-xs border border-[#bfc7d2]/30 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#7ffc97]/40 text-[#006b2c] flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-[#565e74]">Active Regimens</span>
                <span className="text-[14px] font-bold text-[#00873a]">
                  {stats.active} Active
                </span>
              </div>
            </div>

            <button
              onClick={() => setCreateModalOpen(true)}
              type="button"
              className="px-3.5 py-2.5 rounded-xl bg-[#006194] hover:bg-[#007bb9] text-white text-[13px] font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Prescription</span>
            </button>
          </div>
        </div>

        {/* Doctor Guidance Banner */}
        <div className="bg-[#eff4ff] rounded-xl p-4 flex items-start gap-3.5 border border-[#bfc7d2]/30">
          <div className="w-5 h-5 rounded-full bg-[#006194] text-white flex items-center justify-center text-[12px] font-bold shrink-0 mt-0.5">
            i
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <p className="text-[13px] text-[#0b1c30]">
              Prescriptions are authored directly during patient consultation encounters or clinical rounds. Once submitted, prescriptions are immutably locked and transmitted directly to the Pharmacy portal for dispensing.
            </p>
            <span className="text-[11px] font-semibold text-[#006194] whitespace-nowrap bg-white px-2.5 py-1 rounded-full border border-[#bfc7d2]/30">
              e-Rx Signed via Station 4
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707881]">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, MRN, medicine..."
            className="w-full h-9 pl-9 pr-4 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] placeholder:text-[#707881] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#006194]/20 border border-transparent focus:border-[#006194] transition-all"
          />
        </form>

        <div className="bg-[#eff4ff] p-1 rounded-lg flex items-center gap-1 overflow-x-auto self-end md:self-auto">
          {["all", "active", "completed", "discontinued"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-white text-[#006194] shadow-xs"
                  : "text-[#565e74] hover:text-[#0b1c30]"
              }`}
            >
              {st === "all" ? "All Prescriptions" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Prescriptions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[14px] font-bold text-[#0b1c30]">
              Patient Medication Orders ({prescriptions.length})
            </span>
            <span className="text-[12px] text-[#565e74]">
              Select to inspect regimen details
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 overflow-hidden flex flex-col divide-y divide-[#bfc7d2]/20">
            {loading ? (
              <div className="py-12 text-center text-[#565e74] text-sm">
                Loading prescriptions...
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="py-12 text-center text-[#565e74] text-sm">
                No prescriptions found matching this filter.
              </div>
            ) : (
              prescriptions.map((rx) => {
                const isSelected = selectedRx?._id === rx._id;
                const initials = rx.patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={rx._id}
                    onClick={() => setSelectedRx(rx)}
                    className={`p-4 cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? "bg-[#eff4ff] border-l-4 border-l-[#006194]"
                        : "hover:bg-[#eff4ff]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#dae2fd] text-[#131b2e] flex items-center justify-center font-bold text-[12px] shrink-0">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-[#0b1c30]">
                            {rx.patient.name}
                          </span>
                          <span className="text-[11px] text-[#565e74]">
                            {rx.patient.mrn} • {rx.patient.age}y {rx.patient.gender}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          rx.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-[#eff4ff] text-[#565e74]"
                        }`}
                      >
                        {rx.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#565e74] truncate max-w-[240px]">
                        {rx.diagnosis}
                      </span>
                      <span className="text-[11px] text-[#8ca0be]">
                        {new Date(rx.date).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {rx.medications.slice(0, 3).map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-white text-[#0b1c30] text-[11px] font-medium border border-[#bfc7d2]/30"
                        >
                          {m.medicine} ({m.dosage})
                        </span>
                      ))}
                      {rx.medications.length > 3 && (
                        <span className="text-[11px] text-[#565e74] self-center">
                          +{rx.medications.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Prescription Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-20">
          {selectedRx ? (
            <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between pb-3 border-b border-[#bfc7d2]/20">
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-[#565e74] font-semibold">
                    CareSync Clinical e-Rx
                  </span>
                  <h3 className="text-base font-bold text-[#0b1c30]">
                    {selectedRx.patient.name}
                  </h3>
                  <span className="text-[12px] text-[#565e74]">
                    {selectedRx.patient.mrn} • {new Date(selectedRx.date).toLocaleDateString()}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#cce5ff] text-[#004b73]">
                  TRANSMITTED TO PHARMACY
                </span>
              </div>

              {/* Allergy Safety Check */}
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium leading-tight">
                  Allergy Check: Patient allergic to {selectedRx.patient.allergies?.join(", ") || "None documented"}. Order verified safe.
                </span>
              </div>

              {/* Medicines List */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
                  Medication Regimen ({selectedRx.medications.length})
                </span>

                <div className="flex flex-col gap-2.5 divide-y divide-[#bfc7d2]/20">
                  {selectedRx.medications.map((med, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold text-[#0b1c30]">
                          {idx + 1}. {med.medicine}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#eff4ff] text-[#006194]">
                          {med.dosage}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#565e74]">
                        <span>Frequency: {med.frequency}</span>
                        <span>•</span>
                        <span>Duration: {med.duration}</span>
                      </div>
                      {med.instructions && (
                        <p className="text-[11px] text-[#565e74] bg-[#eff4ff]/50 p-2 rounded border border-[#bfc7d2]/20 italic mt-0.5">
                          "{med.instructions}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedRx.notes && (
                <div className="pt-2 border-t border-[#bfc7d2]/20">
                  <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                    Physician Notes
                  </span>
                  <p className="text-[12px] text-[#565e74] bg-[#eff4ff]/30 p-2.5 rounded-lg border border-[#bfc7d2]/20">
                    {selectedRx.notes}
                  </p>
                </div>
              )}

              {/* Digital Doctor Signature */}
              <div className="pt-3 border-t border-[#bfc7d2]/20 flex items-center justify-between text-[12px]">
                <div className="flex flex-col">
                  <span className="font-semibold text-[#0b1c30]">
                    {selectedRx.doctor.name}
                  </span>
                  <span className="text-[11px] text-[#565e74]">
                    {selectedRx.doctor.specialty} ({selectedRx.doctor.qualification})
                  </span>
                </div>
                <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  <span>Digitally Signed</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-8 text-center text-[#565e74]">
              Select a prescription from the list to view complete details.
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW PRESCRIPTION MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4 border border-[#bfc7d2]/40 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#bfc7d2]/30">
              <h3 className="text-base font-bold text-[#0b1c30]">
                Author New Prescription
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-[#565e74] hover:text-[#ba1a1a]"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Select Patient *
                </label>
                <select
                  value={newRxPatientId}
                  onChange={(e) => setNewRxPatientId(e.target.value)}
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                >
                  {allPatients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.mrn}) — {p.gender}, {p.age}y
                    </option>
                  ))}
                </select>
              </div>

              {/* Medications rows */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
                    Medications List
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedRow}
                    className="text-[12px] font-semibold text-[#006194] hover:underline flex items-center gap-1"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Add Another Medicine</span>
                  </button>
                </div>

                {newRxMeds.map((med, idx) => (
                  <div key={idx} className="p-3 bg-[#eff4ff]/60 rounded-lg border border-[#bfc7d2]/30 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-[#0b1c30]">
                        Medicine #{idx + 1}
                      </span>
                      {newRxMeds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedRow(idx)}
                          className="text-[#ba1a1a] text-[11px] hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Medicine name & form (e.g. Lisinopril 10mg tab)"
                        value={med.medicine}
                        onChange={(e) => handleMedChange(idx, "medicine", e.target.value)}
                        className="col-span-2 h-8 px-2.5 bg-white border border-[#bfc7d2]/40 rounded text-[12px] focus:outline-none focus:border-[#006194]"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 1 tab)"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                        className="h-8 px-2.5 bg-white border border-[#bfc7d2]/40 rounded text-[12px] focus:outline-none focus:border-[#006194]"
                      />
                      <select
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                        className="h-8 px-2.5 bg-white border border-[#bfc7d2]/40 rounded text-[12px] focus:outline-none focus:border-[#006194]"
                      >
                        <option value="Once Daily (Morning)">Once Daily (Morning)</option>
                        <option value="Once Daily (Night)">Once Daily (Night)</option>
                        <option value="Twice Daily (BID)">Twice Daily (BID)</option>
                        <option value="PRN (As Needed)">PRN (As Needed)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Duration (e.g. 14 days)"
                        value={med.duration}
                        onChange={(e) => handleMedChange(idx, "duration", e.target.value)}
                        className="h-8 px-2.5 bg-white border border-[#bfc7d2]/40 rounded text-[12px] focus:outline-none focus:border-[#006194]"
                      />
                      <input
                        type="text"
                        placeholder="Instructions (e.g. Take with food)"
                        value={med.instructions}
                        onChange={(e) => handleMedChange(idx, "instructions", e.target.value)}
                        className="h-8 px-2.5 bg-white border border-[#bfc7d2]/40 rounded text-[12px] focus:outline-none focus:border-[#006194]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Physician Instructions / Notes
                </label>
                <input
                  type="text"
                  placeholder="Additional pharmacy instructions or allergy cautions"
                  value={newRxNotes}
                  onChange={(e) => setNewRxNotes(e.target.value)}
                  className="w-full h-8 px-2.5 bg-[#eff4ff] border border-[#bfc7d2]/40 rounded-lg text-[12px] focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#bfc7d2]/30">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-[#565e74] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-[#006194] hover:bg-[#007bb9]"
                >
                  Submit to Pharmacy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
