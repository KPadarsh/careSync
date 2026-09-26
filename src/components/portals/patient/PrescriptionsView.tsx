"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface Medication {
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  refillsRemaining: number;
}

interface PrescriptionDoc {
  _id: string;
  doctorId?: {
    name: string;
    specialty: string;
    department: string;
  };
  date: string;
  status: "active" | "completed" | "discontinued";
  medications: Medication[];
  notes?: string;
}

export function PrescriptionsView() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRx, setSelectedRx] = useState<PrescriptionDoc | null>(null);

  useEffect(() => {
    fetch("/api/patient/prescriptions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.prescriptions) {
          setPrescriptions(data.prescriptions);
        }
      })
      .catch((err) => console.error("Error loading prescriptions:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = prescriptions.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Prescriptions</h2>
          <p className="text-sm text-[#45464d] mt-1">
            Physician-prescribed medications, dosage instructions, and active treatment schedules.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#e2e8f0] pb-3">
        {[
          { id: "all", label: "All Prescriptions" },
          { id: "active", label: "Active" },
          { id: "completed", label: "Completed" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filterStatus === tab.id
                ? "bg-[#131b2e] text-white"
                : "bg-[#eff4ff] text-[#45464d] hover:text-[#0b1c30]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-[#e2e8f0] animate-pulse space-y-3">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-16 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#22c55e] mx-auto flex items-center justify-center mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p className="font-semibold text-[#0b1c30]">No prescriptions found</p>
          <p className="text-xs text-[#45464d] mt-1">There are no prescriptions matching this category.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filtered.map((item) => (
            <Card
              key={item._id}
              className="p-6 border border-[#e2e8f0] shadow-sm flex flex-col justify-between hover:border-[#131b2e]/30 transition-all space-y-4"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-[#e2e8f0]">
                  <div>
                    <span className="text-[11px] font-mono text-[#45464d]">
                      Issued: {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <h4 className="text-sm font-bold text-[#0b1c30]">
                      Prescribed by {item.doctorId?.name || "Consulting Doctor"}
                    </h4>
                    <p className="text-xs text-[#006a61]">{item.doctorId?.specialty}</p>
                  </div>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                      item.status === "active"
                        ? "bg-[#22c55e]/10 text-[#22c55e]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                {/* Medications List */}
                <div className="space-y-3">
                  {item.medications.map((med, idx) => (
                    <div
                      key={idx}
                      className="bg-[#eff4ff]/60 border border-[#dce9ff] rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-[#0b1c30]">{med.medicine}</p>
                          <p className="text-[11px] font-semibold text-[#006a61]">{med.dosage}</p>
                        </div>
                        <span className="text-[11px] bg-white border border-[#e2e8f0] px-2 py-0.5 rounded text-[#45464d]">
                          Duration: {med.duration}
                        </span>
                      </div>

                      <div className="text-xs text-[#0b1c30] bg-white p-2.5 rounded-lg border border-[#e2e8f0]">
                        <p className="font-semibold text-[11px] text-[#45464d] uppercase mb-0.5">
                          Frequency &amp; Directions
                        </p>
                        <p>{med.frequency}</p>
                        <p className="text-[11px] text-[#45464d] mt-1">{med.instructions}</p>
                      </div>

                      {med.refillsRemaining !== undefined && (
                        <div className="flex justify-between items-center text-[11px] text-[#45464d] pt-1">
                          <span>Authorized Refills:</span>
                          <strong className="text-[#0b1c30] font-bold">{med.refillsRemaining}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {item.notes && (
                  <p className="text-[11px] text-[#45464d] italic">
                    Doctor Note: &quot;{item.notes}&quot;
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[#e2e8f0] flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedRx(item)}
                  className="text-xs font-semibold text-[#006a61] hover:underline cursor-pointer flex items-center gap-1"
                >
                  View Details &amp; Print Slip
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Prescription Details Modal */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0b1c30]">Official Prescription Record</h3>
                <p className="text-xs text-[#45464d]">
                  Prescribed on {new Date(selectedRx.date).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRx(null)}
                className="text-[#45464d] hover:text-[#0b1c30] p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-[#45464d] bg-[#eff4ff] p-3 rounded-lg flex justify-between items-center">
                <span>Physician: <strong>{selectedRx.doctorId?.name}</strong></span>
                <span>Specialty: <strong>{selectedRx.doctorId?.specialty}</strong></span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto">
                {selectedRx.medications.map((m, idx) => (
                  <div key={idx} className="p-3 border border-[#e2e8f0] rounded-lg text-xs space-y-1">
                    <p className="font-bold text-[#0b1c30]">{m.medicine} ({m.dosage})</p>
                    <p className="text-[#45464d]">Frequency: {m.frequency}</p>
                    <p className="text-[#45464d]">Duration: {m.duration}</p>
                    <p className="text-[#45464d]">Instructions: {m.instructions}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
              >
                Print Slip
              </button>
              <button
                type="button"
                onClick={() => setSelectedRx(null)}
                className="px-5 py-2 bg-[#131b2e] text-white rounded-lg text-xs font-semibold hover:bg-[#213145] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
