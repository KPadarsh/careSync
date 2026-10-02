"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
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
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <PageHeader
        title="Medical Records"
        description="Review previous consultations, diagnostic histories, and clinical encounters."
        badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <LockIcon className="w-3.5 h-3.5" />
            Encrypted Clinical Archive
          </span>
        }
        actions={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-600 shadow-xs">
            <RecordsIcon className="w-4 h-4 text-blue-600" />
            <span>Archived: <strong className="text-slate-900 font-semibold">{records.length} Records</strong></span>
          </div>
        }
      />

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <SearchIcon className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient, MRN, encounter..."
            className="w-full h-9 pl-9 pr-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 border border-slate-200 focus:border-blue-500 transition-all"
          />
        </form>

        <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 overflow-x-auto self-end sm:self-auto">
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
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                categoryFilter === cat.id
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
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
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Encounter Documentation ({records.length})
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col divide-y divide-slate-100">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading clinical records...
              </div>
            ) : records.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
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
                        ? "bg-sky-50/70 border-l-4 border-l-blue-600"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {rec.patient.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {rec.patient.mrn} • {rec.patient.age}y {rec.patient.gender}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Finalized
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">
                        {rec.title}
                      </span>
                      <span className="text-xs text-slate-400">
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
        <div className="lg:col-span-7 flex flex-col gap-4 sticky top-20">
          {selectedRecord ? (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-6 flex flex-col gap-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                      {selectedRecord.category.toUpperCase()}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400">
                      {new Date(selectedRecord.recordDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedRecord.title}
                  </h2>
                  <span className="text-xs text-slate-500">
                    Patient: <strong className="text-slate-800">{selectedRecord.patient.name}</strong> ({selectedRecord.patient.mrn})
                  </span>
                </div>

                <button
                  onClick={() => setAddendumModalOpen(true)}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-200"
                >
                  <PlusIcon className="w-3.5 h-3.5" />
                  <span>Add Addendum</span>
                </button>
              </div>

              {/* Record Summary Body */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Clinical Summary &amp; Encounter Notes
                </span>
                <div className="p-4 bg-slate-50 rounded-xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans border border-slate-100">
                  {selectedRecord.summary}
                </div>
              </div>

              {/* Facility & Doctor Signature block */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  <span className="block font-semibold text-slate-800">
                    {selectedRecord.doctor.name}
                  </span>
                  <span className="text-slate-400">{selectedRecord.facility}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 text-[11px] font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Immutable Signed Record</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-8 text-center text-slate-400 text-xs">
              Select a medical record from the list to view encounter documentation.
            </div>
          )}
        </div>
      </div>

      {/* CLINICAL ADDENDUM REVISION MODAL */}
      {addendumModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900">
                  Append Clinical Addendum
                </h3>
                <span className="text-xs text-slate-400">
                  Finalized clinical encounters cannot be overwritten; this creates a formal signed addendum.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAddendumModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddendumSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for Addendum / Revision *
                </label>
                <input
                  type="text"
                  required
                  value={reasonForRevision}
                  onChange={(e) => setReasonForRevision(e.target.value)}
                  placeholder="e.g. Supplementary diagnostic findings or post-encounter follow-up clarification"
                  className="w-full h-9 px-3 bg-white rounded-lg text-xs sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Addendum Clinical Notes *
                </label>
                <textarea
                  required
                  rows={4}
                  value={addendumNote}
                  onChange={(e) => setAddendumNote(e.target.value)}
                  placeholder="Type clinical addendum note to append to the permanent medical record..."
                  className="w-full p-2.5 bg-white rounded-lg text-xs sm:text-sm text-slate-900 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddendumModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAddendum}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {submittingAddendum ? "Appending..." : "Append Signed Addendum"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
