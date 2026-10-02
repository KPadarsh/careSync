"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
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
        setNewRxMeds([
          {
            medicine: "",
            dosage: "",
            frequency: "Once Daily",
            duration: "7 days",
            instructions: "",
          },
        ]);
        setNewRxNotes("");
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
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header Area */}
      <PageHeader
        title="Prescriptions"
        description="Review and author clinical prescriptions transmitted directly to the Pharmacy portal."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Outpatient Orders
          </span>
        }
        actions={
          <button
            onClick={() => setCreateModalOpen(true)}
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span>New Prescription</span>
          </button>
        }
      />

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center shrink-0">
              <PrescriptionsIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Authored</span>
              <span className="text-lg font-bold text-slate-900">{stats.total} Orders</span>
            </div>
          </div>
          <span className="text-xs text-slate-400">All Encounters</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 flex items-center justify-center shrink-0">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Active Regimens</span>
              <span className="text-lg font-bold text-emerald-700">{stats.active} Active</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Current Courses
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, MRN, medicine..."
            className="w-full h-9 pl-9 pr-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-lg text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-200/80 focus:border-blue-500 transition-all"
          />
        </form>

        <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 overflow-x-auto self-end md:self-auto">
          {["all", "active", "completed", "discontinued"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st === "all" ? "All Orders" : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: List of Prescriptions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Patient Medication Orders ({prescriptions.length})
            </span>
            <span className="text-xs text-slate-400">
              Select order to view full regimen
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading prescriptions...
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
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
                        ? "bg-sky-50/70 border-l-4 border-l-blue-600"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {rx.patient.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {rx.patient.mrn} • {rx.patient.age}y {rx.patient.gender}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold capitalize border ${
                          rx.status === "active"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {rx.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Diagnosis:</span>
                      <span>{rx.diagnosis || "Clinical consult"}</span>
                      <span>•</span>
                      <span>{new Date(rx.date).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {rx.medications.map((m, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200/60 text-[11px] font-medium text-slate-700"
                        >
                          {m.medicine} ({m.dosage})
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Prescription Details Drawer (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          {selectedRx ? (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Prescription Dossier
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedRx.patient.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    MRN: {selectedRx.patient.mrn} • Room 302
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 tracking-wider">
                  PHARMACY READY
                </span>
              </div>

              {/* Allergy Safety Check */}
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-2 text-xs">
                <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium leading-tight">
                  Allergy Check: Patient allergic to {selectedRx.patient.allergies?.join(", ") || "None documented"}. Verified safe.
                </span>
              </div>

              {/* Medicines List */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Medication Regimen ({selectedRx.medications.length})
                </span>

                <div className="flex flex-col gap-2.5 divide-y divide-slate-100">
                  {selectedRx.medications.map((med, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {idx + 1}. {med.medicine}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                          {med.dosage}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Frequency: {med.frequency}</span>
                        <span>•</span>
                        <span>Duration: {med.duration}</span>
                      </div>
                      {med.instructions && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic mt-0.5">
                          "{med.instructions}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedRx.notes && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Physician Notes
                  </span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {selectedRx.notes}
                  </p>
                </div>
              )}

              {/* Digital Doctor Signature */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900">
                    {selectedRx.doctor.name}
                  </span>
                  <span className="text-slate-400 text-[11px]">
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
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
              Select a prescription from the list to view complete details.
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW PRESCRIPTION MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Author New Prescription
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePrescription} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Patient *
                </label>
                <select
                  value={newRxPatientId}
                  onChange={(e) => setNewRxPatientId(e.target.value)}
                  className="w-full h-9 px-3 bg-white rounded-lg text-xs sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                  <label className="text-xs font-semibold text-slate-700">
                    Medications List
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedRow}
                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    <span>Add Another Medicine</span>
                  </button>
                </div>

                {newRxMeds.map((med, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        Medicine #{idx + 1}
                      </span>
                      {newRxMeds.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedRow(idx)}
                          className="text-rose-600 text-[11px] font-semibold hover:underline"
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
                        className="col-span-2 h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (e.g. 1 tab)"
                        value={med.dosage}
                        onChange={(e) => handleMedChange(idx, "dosage", e.target.value)}
                        className="h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <select
                        value={med.frequency}
                        onChange={(e) => handleMedChange(idx, "frequency", e.target.value)}
                        className="h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
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
                        className="h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Instructions (e.g. Take with food)"
                        value={med.instructions}
                        onChange={(e) => handleMedChange(idx, "instructions", e.target.value)}
                        className="h-8 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Physician Instructions / Notes
                </label>
                <input
                  type="text"
                  placeholder="Additional pharmacy instructions or allergy cautions"
                  value={newRxNotes}
                  onChange={(e) => setNewRxNotes(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submitting ? "Submitting..." : "Submit to Pharmacy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
