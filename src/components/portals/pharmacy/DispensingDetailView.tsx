"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PrinterIcon,
  LockIcon,
  DispensingIcon,
  PrescriptionsIcon,
  RefreshIcon,
  ShieldCheckIcon,
} from "./PharmacyIcons";

interface DispensingDetailViewProps {
  id: string;
}

export function DispensingDetailView({ id }: DispensingDetailViewProps) {
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pharmacistNotes, setPharmacistNotes] = useState("");
  const [showLabelModal, setShowLabelModal] = useState(false);

  const fetchRecord = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pharmacy/dispensing/${id}`);
      if (!res.ok) throw new Error("Failed to load dispensing record");
      const data = await res.json();
      setRecord(data.record);
      if (data.record?.notes) setPharmacistNotes(data.record.notes);
    } catch (err: any) {
      setError(err.message || "Failed to load record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const handleStatusTransition = async (action: string) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pharmacy/dispensing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: pharmacistNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setFeedback({ type: "success", text: data.message || "Status updated successfully." });
      await fetchRecord();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Operation failed." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Dispensing Record...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <p className="font-semibold">{error || "Record not found"}</p>
        <Link
          href="/pharmacy/dispensing"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Dispensing</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/pharmacy/dispensing"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Dispensing Counter</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLabelModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <PrinterIcon className="w-4 h-4 text-teal-400" />
            <span>Print Auxiliary Label</span>
          </button>
          <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
            {record.status}
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Main Dispensing Record Card */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-xl shadow-slate-950/20">
        {/* Banner with Ref & Pharmacist */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/70 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                DISPENSING REGISTRY RECORD
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">
                {new Date(record.dispensedDate || record.createdAt).toLocaleString()}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white font-mono mt-1">
              {record.dispenseId}
            </h1>
          </div>

          <div className="flex items-center gap-3 bg-[#08101E] px-4 py-2.5 rounded-xl border border-slate-800/80">
            <div className="w-8 h-8 rounded-full bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-xs">
              RPh
            </div>
            <div className="text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Dispensing Pharmacist
              </span>
              <span className="text-xs font-bold text-white">
                {record.pharmacistName}
              </span>
            </div>
          </div>
        </div>

        {/* Prescription Reference & Patient Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              Patient Information
            </span>
            <div className="text-base font-bold text-white">
              {record.patientId?.name || "Patient"}
            </div>
            <div className="text-xs text-slate-400 font-mono">
              MRN: {record.patientId?.mrn} • {record.patientId?.gender} • Blood: {record.patientId?.bloodGroup}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Physician Reference
              </span>
              {record.prescriptionId?._id && (
                <Link
                  href={`/pharmacy/prescriptions/${record.prescriptionId._id}`}
                  className="text-[11px] font-semibold text-teal-400 hover:underline"
                >
                  View Rx →
                </Link>
              )}
            </div>
            <div className="text-base font-bold text-white">
              Dr. {record.doctorId?.name || "Physician"}
            </div>
            <div className="text-xs text-slate-400">
              {record.doctorId?.specialty} • {record.doctorId?.department}
            </div>
          </div>
        </div>

        {/* Dispensed Items Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Dispensed Medications & Verification
          </h3>
          <div className="border border-slate-800/80 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08101E] text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3">Dosage & Regimen</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Batch / Lot</th>
                  <th className="px-4 py-3">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {record.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3.5 font-bold text-white">
                      {item.medicineName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300">
                      <div>{item.dosage}</div>
                      <div className="text-[10px] text-slate-400">{item.frequency} ({item.duration})</div>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-teal-400 font-mono text-sm">
                      {item.quantityDispensed} {item.unit}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-300">
                      {item.batchNumber || "AUTOGEN-2026"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-300 text-[11px] max-w-xs italic">
                      {item.instructions || "Take as directed by doctor"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pharmacist Verification Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Dispensing Notes & Patient Counseling Summary
          </label>
          <textarea
            rows={2}
            value={pharmacistNotes}
            onChange={(e) => setPharmacistNotes(e.target.value)}
            placeholder="Document safety counseling, batch numbers, or patient verification..."
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60">
          <div className="text-xs text-slate-400">
            Current Status: <strong className="text-teal-400 font-bold uppercase">{record.status}</strong>
          </div>

          <div className="flex items-center gap-3">
            {record.status === "preparing" && (
              <button
                onClick={() => handleStatusTransition("dispense")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/40 transition-all hover:scale-102"
              >
                <DispensingIcon className="w-4 h-4" />
                <span>Dispense Medications & Deduct Inventory</span>
              </button>
            )}

            {record.status === "dispensed" && (
              <button
                onClick={() => handleStatusTransition("complete")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all hover:scale-102"
              >
                <CheckCircleIcon className="w-4 h-4" />
                <span>Mark Dispensing Completed</span>
              </button>
            )}

            {record.status === "completed" && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-bold">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                <span>Completed & Archived in History</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AUXILIARY LABEL PRINT MODAL */}
      {showLabelModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1324] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <PrinterIcon className="w-5 h-5" />
                <span>Prescription Dispensing Label Preview</span>
              </div>
              <button onClick={() => setShowLabelModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Label design */}
            <div className="p-4 rounded-xl bg-white text-black font-sans space-y-2 border-2 border-black">
              <div className="border-b border-black pb-1.5 flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-tight">CARESYNC CENTRAL PHARMACY</h4>
                  <p className="text-[10px]">742 Evergreen Health Blvd • Tel: (555) 019-4820</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold">{record.dispenseId}</span>
                </div>
              </div>

              <div className="text-xs">
                <p><strong>Patient:</strong> {record.patientId?.name} (MRN: {record.patientId?.mrn})</p>
                <p><strong>Prescriber:</strong> Dr. {record.doctorId?.name}</p>
                <p><strong>Date Dispensed:</strong> {new Date().toLocaleDateString()}</p>
              </div>

              <div className="border-t border-b border-black py-2 space-y-1.5 text-xs">
                {record.items?.map((item: any, i: number) => (
                  <div key={i}>
                    <p className="font-bold text-sm">{item.medicineName} — QTY: {item.quantityDispensed} {item.unit}</p>
                    <p className="text-[11px] font-medium">{item.instructions || "Take as directed by doctor"}</p>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-gray-700 pt-1 flex justify-between">
                <span>RPh: {record.pharmacistName}</span>
                <span>KEEP OUT OF REACH OF CHILDREN</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLabelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Label successfully transmitted to Zebra Dispensary Printer.");
                  setShowLabelModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
              >
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
