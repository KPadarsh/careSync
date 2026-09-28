"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  LockIcon,
  DispensingIcon,
  PrescriptionsIcon,
  RefreshIcon,
  ShieldCheckIcon,
} from "./PharmacyIcons";

interface PrescriptionDetailViewProps {
  id: string;
}

export function PrescriptionDetailView({ id }: PrescriptionDetailViewProps) {
  const router = useRouter();
  const [prescription, setPrescription] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [allAvailable, setAllAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pharmacist action states
  const [pharmacistNotes, setPharmacistNotes] = useState("");
  const [clarificationModalOpen, setClarificationModalOpen] = useState(false);
  const [clarificationReason, setClarificationReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pharmacy/prescriptions/${id}`);
      if (!res.ok) throw new Error("Failed to fetch prescription details");
      const data = await res.json();
      setPrescription(data.prescription);
      setAvailability(data.availability || []);
      setAllAvailable(data.allAvailable || false);
      if (data.prescription?.pharmacistNotes) {
        setPharmacistNotes(data.prescription.pharmacistNotes);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load prescription details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAction = async (action: string, payload: any = {}) => {
    setActionLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`/api/pharmacy/prescriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          pharmacistNotes,
          ...payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setFeedbackMsg({ type: "success", text: data.message || "Operation successful." });
      if (action === "start_dispensing" && data.dispensingRecordId) {
        setTimeout(() => {
          router.push(`/pharmacy/dispensing/${data.dispensingRecordId}`);
        }, 800);
      } else {
        await fetchDetails();
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "An error occurred." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarificationReason.trim()) return;
    await handleAction("request_clarification", { clarificationReason: clarificationReason.trim() });
    setClarificationModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Prescription Details...</p>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <p className="font-semibold">{error || "Prescription not found"}</p>
        <Link
          href="/pharmacy/prescriptions"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Prescriptions</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/pharmacy/prescriptions"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Prescriptions</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono">
            Issued: {new Date(prescription.date || prescription.createdAt).toLocaleDateString()}
          </span>
          <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30">
            {prescription.status}
          </span>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/15 border-rose-500/30 text-rose-300"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* CRITICAL RBAC LOCKED NOTICE BANNER */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#101D36] to-slate-900 border border-teal-500/30 flex items-start gap-3.5 shadow-md">
        <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
          <LockIcon className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h3 className="font-bold text-slate-200">
            Physician Prescription Integrity Protected
          </h3>
          <p className="text-slate-400 mt-0.5">
            By clinical regulations and system permissions, pharmacists cannot alter prescribed medicine names,
            dosages, frequencies, or durations. If any regimen adjustment is warranted, submit a clarification request
            directly to Dr. {prescription.doctorId?.name || "the prescribing physician"}.
          </p>
        </div>
      </div>

      {/* PATIENT & DOCTOR INFO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Card */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Patient Identification
            </span>
            <span className="text-xs font-mono font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded border border-teal-800/60">
              {prescription.patientId?.mrn || "MRN-00000"}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="text-base font-bold text-white">
              {prescription.patientId?.name || "Patient"}
            </div>
            <div className="text-slate-400 flex items-center gap-3">
              <span>Gender: {prescription.patientId?.gender || "N/A"}</span>
              <span>• Blood Group: <strong className="text-white">{prescription.patientId?.bloodGroup || "N/A"}</strong></span>
            </div>
            <div className="text-slate-400">
              Phone: {prescription.patientId?.phone || "No contact"}
            </div>
            {prescription.patientId?.allergies && prescription.patientId?.allergies.length > 0 && (
              <div className="pt-2 flex items-center gap-1.5">
                <AlertTriangleIcon className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-rose-400 font-semibold text-[11px]">
                  Known Allergies: {prescription.patientId?.allergies.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Card */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Prescribing Physician
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {prescription.doctorId?.department || "General Medicine"}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="text-base font-bold text-white">
              Dr. {prescription.doctorId?.name || "Doctor"}
            </div>
            <div className="text-slate-400">
              {prescription.doctorId?.qualification || "Medical Practitioner"} • {prescription.doctorId?.specialty}
            </div>
            <div className="text-slate-400">
              Room / Clinic: {prescription.doctorId?.roomNumber || "Main Clinic"}
            </div>
            {prescription.notes && (
              <div className="pt-2 text-slate-300 italic border-t border-slate-800/60 mt-2 text-[11px]">
                "Doctor's Clinical Notes: {prescription.notes}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRESCRIBED MEDICINES WITH AVAILABILITY CHECK */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">
              Prescribed Medications & Inventory Match
            </h2>
            <p className="text-xs text-slate-400">
              Doctor items locked. Verify real-time dispensary stock availability.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction("check_availability")}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
              <span>Re-check Stock</span>
            </button>
            <div
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                allAvailable
                  ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
              }`}
            >
              {allAvailable ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                  <span>All In Stock</span>
                </>
              ) : (
                <>
                  <AlertTriangleIcon className="w-4 h-4 text-rose-400" />
                  <span>Shortage Detected</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Medication Items List */}
        <div className="space-y-3">
          {availability.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Clinical locked items */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-bold text-white">{item.medicineName}</span>
                  <span title="Locked field" className="text-slate-400">
                    <LockIcon className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-mono">
                    Dosage: {item.prescribedDosage}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Frequency: {item.prescribedFrequency}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Duration: {item.prescribedDuration}
                  </span>
                </div>
                <p className="text-xs text-slate-400 italic">
                  Instructions: {item.instructions || "As directed by physician"}
                </p>
              </div>

              {/* Inventory availability match */}
              <div className="flex items-center gap-4 bg-[#08101E] px-4 py-2.5 rounded-xl border border-slate-800/80 self-start md:self-auto shrink-0">
                <div className="text-left md:text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Dispensary Stock
                  </span>
                  <span className={`text-xs font-bold ${item.isAvailable ? "text-emerald-400" : "text-rose-400"}`}>
                    {item.availableQuantity} {item.unit} available
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Location: {item.location}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide ${
                    item.isAvailable
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  {item.isAvailable ? "Available" : "Stockout"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CLARIFICATION DETAILS (IF ANY) */}
      {prescription.status === "clarification_requested" && (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangleIcon className="w-5 h-5" />
            <span>Clarification Requested from Physician</span>
          </div>
          <p className="text-xs text-rose-200">
            <strong>Reason:</strong> {prescription.clarificationReason}
          </p>
          <p className="text-[11px] text-slate-400">
            Awaiting response or revised prescription from Dr. {prescription.doctorId?.name || "Doctor"}.
          </p>
        </div>
      )}

      {/* PHARMACIST WORKFLOW ACTIONS */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Pharmacist Review & Dispensing Actions
        </h3>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Pharmacist Dispensing Notes & Verification Log
          </label>
          <textarea
            rows={2}
            value={pharmacistNotes}
            onChange={(e) => setPharmacistNotes(e.target.value)}
            placeholder="e.g. Stock verified in Shelf A-01, counseling points noted for antibiotic course completion..."
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Left: Request clarification */}
          <button
            onClick={() => setClarificationModalOpen(true)}
            disabled={actionLoading}
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all hover:scale-102"
          >
            Request Clarification from Doctor
          </button>

          {/* Right: Review & Dispensing actions */}
          <div className="flex items-center gap-3">
            {prescription.status === "pending" && (
              <button
                onClick={() => handleAction("review")}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all hover:scale-102"
              >
                Mark as Reviewed
              </button>
            )}

            {prescription.status !== "completed" && prescription.status !== "dispensed" && (
              <button
                onClick={() => handleAction("start_dispensing")}
                disabled={actionLoading || !allAvailable}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all hover:scale-102 ${
                  allAvailable
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-950/40"
                    : "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
                }`}
              >
                <DispensingIcon className="w-4 h-4" />
                <span>
                  {prescription.status === "dispensing"
                    ? "Continue Dispensing Counter"
                    : "Start Dispensing"}
                </span>
              </button>
            )}

            {prescription.dispensingRecordId && (
              <Link
                href={`/pharmacy/dispensing/${prescription.dispensingRecordId}`}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-teal-500/30 transition-all"
              >
                View Dispensing Record →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* CLARIFICATION MODAL */}
      {clarificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1324] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangleIcon className="w-5 h-5" />
                <span>Request Doctor Clarification</span>
              </div>
              <button
                onClick={() => setClarificationModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Explain why clarification is needed from Dr. {prescription.doctorId?.name || "the physician"} (e.g. potential drug interaction, renal dosage adjustment, duration inquiry).
            </p>

            <form onSubmit={handleRequestClarification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Clarification <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={clarificationReason}
                  onChange={(e) => setClarificationReason(e.target.value)}
                  placeholder="e.g. Prescribed dose of 20mg BID exceeds standard 10mg ceiling for patient's GFR. Kindly confirm or adjust."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClarificationModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Send Clarification Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
