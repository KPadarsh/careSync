"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface MedicalRecordDoc {
  _id: string;
  title: string;
  category: "consultation" | "discharge-summary" | "clinical-note" | "immunization" | "imaging";
  recordDate: string;
  facility: string;
  summary: string;
  doctorId?: {
    name: string;
    specialty: string;
    department: string;
  };
}

export function MedicalRecordsView() {
  const [records, setRecords] = useState<MedicalRecordDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecordDoc | null>(null);

  useEffect(() => {
    fetch("/api/patient/medical-records")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.records) {
          setRecords(data.records);
        }
      })
      .catch((err) => console.error("Error loading medical records:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = records.filter((rec) => {
    if (selectedCategory !== "all" && rec.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rec.title.toLowerCase().includes(q);
      const matchDoc = rec.doctorId?.name?.toLowerCase().includes(q);
      const matchSummary = rec.summary.toLowerCase().includes(q);
      return matchTitle || matchDoc || matchSummary;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Medical Records</h2>
          <p className="text-sm text-[#45464d] mt-1">
            Official patient-accessible clinical notes, diagnostic evaluations, and discharge summaries.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border border-[#e2e8f0] shadow-sm">
        {/* Search & Category Filter Bar */}
        <div className="p-4 bg-white border-b border-[#e2e8f0] flex flex-wrap gap-3 items-center justify-between">
          <div className="relative min-w-[240px] flex-1 sm:flex-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#45464d]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by diagnosis, physician..."
              className="w-full bg-[#eff4ff] border-none rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0b1c30] placeholder:text-[#45464d] focus:outline-none focus:ring-1 focus:ring-[#131b2e]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "all", label: "All Records" },
              { id: "consultation", label: "Consultations" },
              { id: "clinical-note", label: "Clinical Notes" },
              { id: "discharge-summary", label: "Discharge Summaries" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#131b2e] text-white"
                    : "bg-[#eff4ff] text-[#45464d] hover:text-[#0b1c30]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Records Listing */}
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-sm text-[#45464d]">
            <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#006a61] mx-auto flex items-center justify-center mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-[#0b1c30]">No medical records found</p>
            <p className="text-xs text-[#45464d] mt-1">There are no records matching your query.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e2e8f0]">
            {filtered.map((record) => (
              <div
                key={record._id}
                className="p-5 hover:bg-[#eff4ff]/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#eff4ff] text-[#006a61] uppercase">
                      {record.category.replace("-", " ")}
                    </span>
                    <span className="text-xs text-[#45464d]">
                      {new Date(record.recordDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#0b1c30]">{record.title}</h4>
                  <p className="text-xs text-[#45464d]">
                    Provider: <strong className="text-[#0b1c30]">{record.doctorId?.name || "CareSync Clinical Staff"}</strong> ({record.doctorId?.specialty || "General Medicine"}) • Facility: {record.facility}
                  </p>
                  <p className="text-xs text-[#0b1c30]/90 line-clamp-2 leading-relaxed bg-[#f8fafc] p-2.5 rounded border border-[#e2e8f0]">
                    {record.summary}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedRecord(record)}
                    className="px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0b1c30]">{selectedRecord.title}</h3>
                <p className="text-xs text-[#45464d]">
                  Recorded {new Date(selectedRecord.recordDate).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-[#45464d] hover:text-[#0b1c30] p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#eff4ff] rounded-lg space-y-1">
                <p><span className="text-[#45464d]">Category:</span> <strong className="capitalize">{selectedRecord.category.replace("-", " ")}</strong></p>
                <p><span className="text-[#45464d]">Attending Doctor:</span> <strong>{selectedRecord.doctorId?.name}</strong></p>
                <p><span className="text-[#45464d]">Facility:</span> <strong>{selectedRecord.facility}</strong></p>
              </div>

              <div>
                <p className="font-semibold text-[#45464d] uppercase tracking-wider mb-1">Clinical Assessment</p>
                <p className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg leading-relaxed text-[#0b1c30]">
                  {selectedRecord.summary}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#0b1c30] hover:bg-[#eff4ff] cursor-pointer"
              >
                Print Clinical Record
              </button>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
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
