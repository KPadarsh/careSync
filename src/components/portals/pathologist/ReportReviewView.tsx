"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MicroscopeIcon,
  VerifiedIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  RefreshCwIcon,
} from "./PathologistIcons";

interface ReportReviewViewProps {
  reportId: string;
}

export function ReportReviewView({ reportId }: ReportReviewViewProps) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [interpretation, setInterpretation] = useState("");
  const [comments, setComments] = useState("");
  const [notes, setNotes] = useState("");

  // Correction Modal State
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");

  // Verification Confirmation Modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/pathologist/reports/${reportId}`);
      if (!res.ok) throw new Error("Failed to load report for review.");
      const json = await res.json();
      setData(json.report);
      setInterpretation(json.report.pathologistInterpretation || "");
      setComments(json.report.pathologistComments || "");
      setNotes(json.report.pathologistNotes || "");
    } catch (err: any) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  // Action: Mark Under Review
  const handleMarkUnderReview = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/pathologist/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_under_review", notes }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update review status.");
      setSuccessMsg(result.message);
      fetchReport();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Save Draft
  const handleSaveDraft = async () => {
    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/pathologist/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_draft",
          interpretation,
          comments,
          notes,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to save draft.");
      setSuccessMsg("Draft interpretation saved successfully.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Request Correction
  const handleRequestCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      setError("Please supply a detailed reason for the correction request.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/pathologist/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_correction",
          correctionReason,
          notes,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to request correction.");

      setShowCorrectionModal(false);
      setSuccessMsg("Correction request dispatched to laboratory technician.");
      setTimeout(() => {
        router.push("/pathologist/reports");
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action: Verify & Finalize
  const handleVerifyAndFinalize = async () => {
    if (!interpretation.trim()) {
      setError("Clinical diagnostic interpretation is required before final sign-off.");
      setShowVerifyModal(false);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/pathologist/reports/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_and_finalize",
          interpretation,
          comments,
          notes,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to finalize report.");

      setShowVerifyModal(false);
      setSuccessMsg("Diagnostic report certified and released to attending physician!");
      setTimeout(() => {
        router.push(`/pathologist/verified/${reportId}`);
      }, 900);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-10 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Retrieving requisition specimen &amp; telemetry...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 p-10 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md">
          <p className="text-sm font-bold text-red-800">Requisition Not Accessible</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <Link
            href="/pathologist/reports"
            className="mt-4 inline-block px-4 py-2 bg-[#00355f] text-white rounded-xl text-xs font-semibold"
          >
            Return to Review Queue
          </Link>
        </div>
      </div>
    );
  }

  const isStat = data.priority === "stat";
  const isUrgent = data.priority === "urgent";

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-8 max-w-6xl mx-auto w-full">
      {/* Navigation Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/pathologist/dashboard" className="hover:text-[#00355f]">
            Pathology
          </Link>
          <span>/</span>
          <Link href="/pathologist/reports" className="hover:text-[#00355f]">
            Review Queue
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{data.testName}</span>
        </div>

        <Link
          href="/pathologist/reports"
          className="text-xs font-semibold text-slate-600 hover:text-[#00355f] flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Queue</span>
        </Link>
      </div>

      {/* Requisition Header & Action Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              {isStat ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                  STAT PRIORITY
                </span>
              ) : isUrgent ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  URGENT ORDER
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                  ROUTINE
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                {data.department}
              </span>

              <span className="font-mono text-xs text-slate-500">
                Sample: {data.sample.sampleId}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-[#002444] tracking-tight">
              {data.testName}
            </h1>
            <p className="text-xs text-slate-500">
              Clinical order placed by <strong className="text-slate-800">{data.doctor.name}</strong> ({data.doctor.department})
            </p>
          </div>

          {/* Action Button Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {data.status === "submitted_for_review" && (
              <button
                type="button"
                onClick={handleMarkUnderReview}
                disabled={submitting}
                className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 text-xs font-semibold transition-all disabled:opacity-50"
              >
                Mark Under Review
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCorrectionModal(true)}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100 text-xs font-semibold transition-all disabled:opacity-50"
            >
              Request Correction
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-all disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={() => setShowVerifyModal(true)}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[#006a68] hover:bg-[#005250] text-white text-xs font-bold shadow-md shadow-teal-900/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <VerifiedIcon className="w-4 h-4 text-[#94f2ef]" />
              <span>Verify &amp; Finalize</span>
            </button>
          </div>
        </div>

        {/* Notifications / Alerts */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertTriangleIcon className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Patient Summary Header Strip (Google Stitch specification) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient</span>
            <span className="font-semibold text-slate-900 block truncate">{data.patient.name}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">MRN</span>
            <span className="font-mono text-slate-800 block">{data.patient.mrn}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender / Blood</span>
            <span className="text-slate-800 block capitalize">{data.patient.gender} • {data.patient.bloodGroup}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ordering MD</span>
            <span className="text-slate-800 block truncate">{data.doctor.name}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Specimen Tube</span>
            <span className="text-slate-800 block truncate">{data.sample.tubeType}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
            <span className="font-semibold text-[#00355f] block uppercase tracking-wider text-[11px]">
              {data.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
      </div>

      {/* ================= RESULTS PARAMETER TABLE ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Analytical Results Inspection
            </h2>
            <p className="text-xs text-slate-500">
              Measurements obtained from automated analyzer bench and wet chemistry verification.
            </p>
          </div>
          <div className="text-xs font-mono text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-200">
            Bench: {data.analyzerBench || "Automated Chemistry"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-6">Parameter</th>
                <th className="py-3 px-4 font-mono">Value</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Reference Range</th>
                <th className="py-3 px-4">Clinical Flag</th>
                <th className="py-3 px-6 text-right">Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.results.map((r: any, idx: number) => {
                const isCrit = r.flag === "critical";
                const isHigh = r.flag === "high";
                const isLow = r.flag === "low";

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isCrit ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{r.parameter}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-slate-900">
                      {r.value}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{r.unit}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{r.referenceRange}</td>
                    <td className="py-3.5 px-4">
                      {isCrit ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white animate-pulse">
                          CRITICAL HIGH
                        </span>
                      ) : isHigh ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          HIGH
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          LOW
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          NORMAL
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {isCrit || isHigh || isLow ? (
                        <span className="text-rose-600 font-bold">▲ Outside Limit</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">✓ In Range</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Technician Notes Strip */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="font-semibold text-slate-700 shrink-0 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Technician Notes ({data.submittedBy}):
          </div>
          <div className="text-slate-600 italic">
            &quot;{data.technicianNotes || "Specimen processed per standard laboratory operating procedures."}&quot;
          </div>
        </div>
      </div>

      {/* ================= PATHOLOGIST CLINICAL EVALUATION FORM ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-[#002444] flex items-center gap-2">
            <MicroscopeIcon className="w-5 h-5 text-[#006a68]" />
            Pathologist Clinical Diagnostic Evaluation
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Provide the formal diagnostic impression, microscopic observations, and clinical guidance for the attending physician.
          </p>
        </div>

        <div className="space-y-4">
          {/* Diagnostic Interpretation */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Diagnostic Interpretation &amp; Clinical Impression <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={interpretation}
              onChange={(e) => setInterpretation(e.target.value)}
              placeholder="e.g. Normocytic normochromic anemia with reactive lymphocytosis. Recommend correlation with serum ferritin and iron saturation studies..."
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:bg-white transition-all"
            />
          </div>

          {/* Clinical Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Pathology Comments &amp; Physician Directives (Optional)
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="e.g. Attending physician Dr. Anil Kumar alerted via clinical telephone consult regarding borderline troponin elevation..."
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:bg-white transition-all"
            />
          </div>

          {/* Internal Workstation Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Internal Lab &amp; Workstation Notes (Private to Pathology Directorate)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Wet bench calibration verified on Cobas 6000 prior to serum assay batch run..."
              className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00355f] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Permission and Role Boundary Guarantee */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">Governance &amp; Medical Protocol Safeguards:</p>
          <p>
            • Only Board Certified Pathologists are permitted to sign off and finalize clinical results.
          </p>
          <p>
            • Altering doctor prescriptions, dispensing pharmaceutical medications, or performing billing is strictly prohibited in this portal.
          </p>
          <p>
            • Once finalized, results cannot be silently overwritten; any subsequent amendments require formal revision logging.
          </p>
        </div>
      </div>

      {/* ================= CORRECTION REQUEST MODAL ================= */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Request Requisition Correction</h3>
                <p className="text-xs text-slate-500">Route back to Phlebotomy / Laboratory Technician</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Specify the pre-analytical or analytical deficiency requiring resolution (e.g., hemolyzed specimen redraw, clotted EDTA tube, high dilution repeat, or analyzer calibration rerun).
            </p>

            <form onSubmit={handleRequestCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Correction Rationale &amp; Directive <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Hemolysis index +3 observed on SST serum tube. Potassium value of 6.2 mEq/L suspect for in-vitro artifact. Stat venipuncture redraw required."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-900/20 disabled:opacity-50"
                >
                  {submitting ? "Dispatching..." : "Dispatch Correction Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VERIFICATION CONFIRMATION MODAL ================= */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-teal-700">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                <VerifiedIcon className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Certify Diagnostic Finding</h3>
                <p className="text-xs text-slate-500">Legal Medical Sign-off • Dr. Sunita Patil, MD</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are certifying that the analytical parameters for <strong className="text-slate-900">{data.testName}</strong> have been reviewed, verified, and accompanied by your diagnostic impression.
            </p>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-800">Interpretation Summary:</div>
              <p className="text-slate-600 italic line-clamp-3">&quot;{interpretation}&quot;</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Return to Edit
              </button>
              <button
                type="button"
                onClick={handleVerifyAndFinalize}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-[#006a68] hover:bg-[#005250] text-white text-xs font-bold shadow-md shadow-teal-900/20 disabled:opacity-50"
              >
                {submitting ? "Signing & Locking..." : "Confirm & Finalize Certification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
