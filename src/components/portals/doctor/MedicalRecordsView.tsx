"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SearchIcon,
  LockIcon,
  RecordsIcon,
  PlusIcon,
  CloseIcon,
  CheckCircleIcon,
} from "./DoctorIcons";

interface MedicalRecordItem {
  _id: string;
  title: string;
  category: string;
  recordDate: string;
  facility: string;
  summary: string;
  doctor: {
    name: string;
    specialty: string;
  };
  patient: {
    _id: string;
    name: string;
    mrn: string;
    age: number;
    gender: string;
    bloodGroup: string;
    allergies: string[];
  };
}

export const MedicalRecordsView: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecordItem | null>(null);

  // Addendum Modal state
  const [addendumModalOpen, setAddendumModalOpen] = useState(false);
  const [addendumNote, setAddendumNote] = useState("");
  const [reasonForRevision, setReasonForRevision] = useState("Supplemental clinical notes");
  const [submittingAddendum, setSubmittingAddendum] = useState(false);

  const fetchRecords = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/doctor/records?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.records || []);
        if (json.records && json.records.length > 0 && !selectedRecord) {
          setSelectedRecord(json.records[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load medical records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords();
  };

  const handleAddendumSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !addendumNote.trim()) return;

    setSubmittingAddendum(true);
    try {
      const res = await fetch("/api/doctor/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: selectedRecord._id,
          addendumNote,
          reasonForRevision,
        }),
      });

      if (res.ok) {
        setAddendumModalOpen(false);
        setAddendumNote("");
        fetchRecords();
      } else {
        alert("Failed to append clinical addendum");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting addendum");
    } finally {
      setSubmittingAddendum(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
              Medical Records
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eff4ff] text-[#006194] text-[11px] font-semibold border border-[#bfc7d2]/30">
              <LockIcon className="w-3.5 h-3.5" />
              <span>Encrypted Archive</span>
            </span>
          </div>
          <p className="text-[14px] text-[#565e74]">
            Review previous consultations, diagnostic histories, and clinical encounters.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#bfc7d2]/30 text-[12px] text-[#565e74]">
          <RecordsIcon className="w-4 h-4 text-[#006194]" />
          <span>Archived Records: <strong className="text-[#0b1c30] font-semibold">{records.length} Encounters</strong></span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl shadow-xs border border-[#bfc7d2]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707881]">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, MRN, encounter..."
            className="w-full h-9 pl-9 pr-4 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] placeholder:text-[#707881] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#006194]/20 border border-transparent focus:border-[#006194] transition-all"
          />
        </form>

        <div className="bg-[#eff4ff] p-1 rounded-lg flex items-center gap-1 overflow-x-auto self-end sm:self-auto">
          {[
            { id: "all", label: "All Records" },
            { id: "consultation", label: "Consultations" },
            { id: "clinical-note", label: "Clinical Notes" },
            { id: "discharge-summary", label: "Discharge" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                categoryFilter === cat.id
                  ? "bg-white text-[#006194] shadow-xs"
                  : "text-[#565e74] hover:text-[#0b1c30]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Master-Detail Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Patient Encounters Master List (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[12px] font-semibold text-[#565e74] uppercase tracking-wider">
              Consultation Records ({records.length})
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 overflow-hidden flex flex-col divide-y divide-[#bfc7d2]/20">
            {loading ? (
              <div className="py-12 text-center text-[#565e74] text-sm">
                Loading clinical records...
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 text-center text-[#565e74] text-sm">
                No medical records found.
              </div>
            ) : (
              records.map((rec) => {
                const isSelected = selectedRecord?._id === rec._id;
                const initials = rec.patient.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={rec._id}
                    onClick={() => setSelectedRecord(rec)}
                    className={`p-4 cursor-pointer transition-all flex flex-col gap-2 ${
                      isSelected
                        ? "bg-[#eff4ff] border-l-4 border-l-[#006194]"
                        : "hover:bg-[#eff4ff]/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#006194] text-white flex items-center justify-center font-bold text-[12px]">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-[#0b1c30]">
                            {rec.patient.name}
                          </span>
                          <span className="text-[11px] text-[#565e74]">
                            {rec.patient.mrn} • {rec.patient.age}y {rec.patient.gender}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Finalized
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-semibold text-[#0b1c30]">
                        {rec.title}
                      </span>
                      <span className="text-[11px] text-[#565e74]">
                        {new Date(rec.recordDate).toLocaleDateString()} • {rec.doctor.name}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Record Detail View (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {selectedRecord ? (
            <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between pb-3 border-b border-[#bfc7d2]/20">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#006194] uppercase tracking-wider">
                      {selectedRecord.category.toUpperCase()}
                    </span>
                    <span className="text-[#bfc7d2]">•</span>
                    <span className="text-[12px] text-[#565e74]">
                      {new Date(selectedRecord.recordDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#0b1c30] mt-0.5">
                    {selectedRecord.title}
                  </h2>
                  <span className="text-[12px] text-[#565e74]">
                    Patient: <strong className="text-[#0b1c30]">{selectedRecord.patient.name}</strong> ({selectedRecord.patient.mrn})
                  </span>
                </div>

                {/* Explicit Revision / Addendum Button */}
                <button
                  onClick={() => setAddendumModalOpen(true)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#eff4ff] hover:bg-[#dce9ff] text-[#006194] text-[12px] font-semibold transition-colors flex items-center gap-1 border border-[#bfc7d2]/30"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Add Clinical Addendum</span>
                </button>
              </div>

              {/* Record Summary Body */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider">
                  Clinical Summary & Encounter Notes
                </span>
                <div className="p-4 bg-[#eff4ff]/40 rounded-xl text-[13px] text-[#0b1c30] leading-relaxed whitespace-pre-wrap font-sans border border-[#bfc7d2]/20">
                  {selectedRecord.summary}
                </div>
              </div>

              {/* Facility & Doctor Signature block */}
              <div className="pt-3 border-t border-[#bfc7d2]/20 flex items-center justify-between text-[12px] text-[#565e74]">
                <div>
                  <span className="block font-semibold text-[#0b1c30]">
                    {selectedRecord.doctor.name}
                  </span>
                  <span>{selectedRecord.facility}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Immutable Signed Record</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-8 text-center text-[#565e74]">
              Select a medical record from the list to view encounter documentation.
            </div>
          )}
        </div>
      </div>

      {/* CLINICAL ADDENDUM REVISION MODAL */}
      {addendumModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 flex flex-col gap-4 border border-[#bfc7d2]/40">
            <div className="flex items-center justify-between pb-3 border-b border-[#bfc7d2]/30">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-[#0b1c30]">
                  Append Clinical Addendum
                </h3>
                <span className="text-[11px] text-[#565e74]">
                  Finalized clinical encounters cannot be overwritten; this creates a formal audit addendum.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAddendumModalOpen(false)}
                className="text-[#565e74] hover:text-[#ba1a1a]"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddendumSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Reason for Addendum / Revision *
                </label>
                <input
                  type="text"
                  required
                  value={reasonForRevision}
                  onChange={(e) => setReasonForRevision(e.target.value)}
                  placeholder="e.g. Supplementary diagnostic findings or post-encounter follow-up clarification"
                  className="w-full h-9 px-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#565e74] uppercase tracking-wider block mb-1">
                  Addendum Clinical Notes *
                </label>
                <textarea
                  required
                  rows={4}
                  value={addendumNote}
                  onChange={(e) => setAddendumNote(e.target.value)}
                  placeholder="Type clinical addendum note to append to the permanent medical record..."
                  className="w-full p-3 bg-[#eff4ff] rounded-lg text-[13px] text-[#0b1c30] border border-[#bfc7d2]/40 focus:outline-none focus:bg-white focus:border-[#006194] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#bfc7d2]/30">
                <button
                  type="button"
                  onClick={() => setAddendumModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] text-[#565e74] hover:bg-[#eff4ff]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddendum}
                  className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white bg-[#006194] hover:bg-[#007bb9]"
                >
                  Append Signed Addendum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
