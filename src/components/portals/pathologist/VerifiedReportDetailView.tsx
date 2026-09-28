"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  VerifiedIcon,
  CheckCircleIcon,
  PrintIcon,
  AlertTriangleIcon,
  ClockIcon,
} from "./PathologistIcons";

interface VerifiedReportDetailViewProps {
  reportId: string;
}

export function VerifiedReportDetailView({ reportId }: VerifiedReportDetailViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Amendment Modal State
  const [showAmendModal, setShowAmendModal] = useState(false);
  const [amendmentReason, setAmendmentReason] = useState("");
  const [updatedInterpretation, setUpdatedInterpretation] = useState("");
  const [updatedComments, setUpdatedComments] = useState("");

  const fetchVerifiedReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/pathologist/verified/${reportId}`);
      if (!res.ok) throw new Error("Failed to load verified report details.");
      const json = await res.json();
      setData(json.report);
      setUpdatedInterpretation(json.report.pathologistInterpretation || "");
    } catch (err: any) {
      setError(err.message || "Failed to load report.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifiedReport();
  }, [reportId]);

  const handleAmendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amendmentReason.trim() || !updatedInterpretation.trim()) {
      setError("Both an explicit amendment rationale and the updated interpretation are required.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch(`/api/pathologist/verified/${reportId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "amend_report",
          amendmentReason,
          updatedInterpretation,
          updatedComments,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to log amendment.");

      setShowAmendModal(false);
      setSuccessMsg("Formal clinical amendment added to revision audit history.");
      setAmendmentReason("");
      fetchVerifiedReport();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 p-10 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Verifying digital certificate &amp; report seal...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex-1 p-10 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md">
          <p className="text-sm font-bold text-red-800">Certificate Error</p>
          <p className="text-xs text-red-600 mt-1">{error}</p>
          <Link
            href="/pathologist/verified"
            className="mt-4 inline-block px-4 py-2 bg-[#00355f] text-white rounded-xl text-xs font-semibold"
          >
            Return to Verified Archive
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-8 max-w-5xl mx-auto w-full">
      {/* Navigation Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/pathologist/dashboard" className="hover:text-[#00355f]">
            Pathology
          </Link>
          <span>/</span>
          <Link href="/pathologist/verified" className="hover:text-[#00355f]">
            Verified Archive
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800 font-mono">
            {data.digitalSignature?.hash}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAmendModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 text-xs font-semibold transition-all"
          >
            Issue Formal Amendment
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#00355f] text-white hover:bg-[#002444] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <PrintIcon className="w-4 h-4 text-[#94f2ef]" />
            <span>Print Official Report</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 print:hidden">
          <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ================= OFFICIAL CERTIFIED REPORT CONTAINER ================= */}
      <div className="bg-white border border-slate-300 rounded-2xl p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Certificate Header Banner */}
        <div className="border-b-2 border-[#00355f] pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-[#002444] uppercase">
                CareSync Clinical Laboratories
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#006a68] text-white">
                CLIA / CAP ACCREDITED
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Department of Pathology &amp; Laboratory Medicine • 100 Hospital Plaza, Medical Suite 400
            </p>
            <p className="text-xs text-slate-500">
              Laboratory Director: <strong className="text-slate-800">{data.digitalSignature.signer}</strong>
            </p>
          </div>

          {/* Digital Signature Seal */}
          <div className="sm:text-right shrink-0 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
            <div className="flex items-center sm:justify-end gap-1.5 text-emerald-800 font-bold">
              <VerifiedIcon className="w-4 h-4 text-emerald-600" />
              <span>DIGITALLY CERTIFIED</span>
            </div>
            <div className="font-mono text-[11px] text-slate-600">
              {data.digitalSignature.hash}
            </div>
            <div className="text-[10px] text-slate-400">
              Certified: {new Date(data.verifiedDate).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Demographics & Requisition Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
              Patient Identification
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Name</span>
                <span className="font-bold text-slate-900 text-sm">{data.patient.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">MRN</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{data.patient.mrn}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">DOB / Age</span>
                <span className="text-slate-800">
                  {data.patient.dob ? new Date(data.patient.dob).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Gender / Blood</span>
                <span className="text-slate-800 capitalize">
                  {data.patient.gender} • {data.patient.bloodGroup}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1">
              Clinical Order Specifications
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Ordering Physician</span>
                <span className="font-semibold text-slate-900">{data.doctor.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Clinical Ward / Dept</span>
                <span className="text-slate-800">{data.doctor.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Sample ID &amp; Specimen</span>
                <span className="font-mono text-slate-800">{data.sample.sampleId} ({data.sample.sampleType})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Collection Date</span>
                <span className="text-slate-800">
                  {new Date(data.sampleCollectionDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Results Parameter Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              {data.testName} — Quantitative Analytical Findings
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Analyzer: {data.analyzerBench || "Cobas 6000 Chemistry"}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-semibold text-[11px]">
                  <th className="py-3 px-4">Test Parameter</th>
                  <th className="py-3 px-4 font-mono">Result Value</th>
                  <th className="py-3 px-4">Units</th>
                  <th className="py-3 px-4">Biological Reference Interval</th>
                  <th className="py-3 px-4 text-right">Interpretation Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.results.map((r: any, idx: number) => {
                  const isCrit = r.flag === "critical";
                  const isHigh = r.flag === "high";
                  const isLow = r.flag === "low";

                  return (
                    <tr key={idx} className={isCrit ? "bg-rose-50/50" : ""}>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.parameter}</td>
                      <td className="py-3 px-4 font-mono font-bold text-sm text-slate-900">
                        {r.value}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.unit}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{r.referenceRange}</td>
                      <td className="py-3 px-4 text-right">
                        {isCrit ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                            CRITICAL HIGH
                          </span>
                        ) : isHigh ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            HIGH
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                            LOW
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Formal Pathologist Diagnostic Interpretation */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <VerifiedIcon className="w-4 h-4 text-[#006a68]" />
              Pathologist Diagnostic Interpretation &amp; Clinical Impression
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Official Medical Record</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-serif">
            {data.pathologistInterpretation}
          </p>

          {data.pathologistComments && (
            <div className="pt-2 text-xs text-slate-600 border-t border-slate-200/80">
              <span className="font-semibold text-slate-700">Physician Directives: </span>
              {data.pathologistComments}
            </div>
          )}
        </div>

        {/* Revision & Amendment Audit Trail (if amended) */}
        {data.revisionHistory && data.revisionHistory.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <ClockIcon className="w-4 h-4 text-amber-700" />
              <span>Formal Clinical Amendment History (Audit Trail)</span>
            </div>

            <div className="space-y-3">
              {data.revisionHistory.map((rev: any, index: number) => (
                <div key={index} className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      Amendment #{index + 1} • {rev.revisedBy}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(rev.revisionDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-amber-800">
                    <strong>Reason:</strong> {rev.reason}
                  </div>
                  <div className="text-slate-500 italic text-[11px]">
                    <strong>Archived Previous Impression:</strong> &quot;{rev.previousInterpretation}&quot;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attestation & Electronic Signature Footer */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800">Electronic Attestation:</p>
            <p>
              Certified by <strong className="text-slate-900">{data.verifiedBy}</strong> on{" "}
              {new Date(data.verifiedDate).toLocaleString()}.
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              CareSync Laboratory Information Systems • Cryptographic Hash Verified • Non-Repudiable
            </p>
          </div>

          <div className="text-right font-mono text-[10px] text-slate-400">
            Page 1 of 1 • Official Diagnostic Pathology Record
          </div>
        </div>
      </div>

      {/* ================= AMENDMENT MODAL ================= */}
      {showAmendModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Issue Formal Clinical Amendment</h3>
                <p className="text-xs text-slate-500">Explicit revision workflow (no silent changes allowed)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with laboratory regulatory standards, finalized pathology reports cannot be silently modified. Issuing an amendment creates an indelible revision record with the timestamp and previous diagnostic findings preserved in the audit log.
            </p>

            <form onSubmit={handleAmendReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Amendment Rationale <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={amendmentReason}
                  onChange={(e) => setAmendmentReason(e.target.value)}
                  placeholder="e.g. Clinical correlation provided by cardiology consult regarding borderline troponin..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Updated Diagnostic Interpretation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={updatedInterpretation}
                  onChange={(e) => setUpdatedInterpretation(e.target.value)}
                  placeholder="Enter updated clinical diagnostic statement..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Additional Addendum Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={updatedComments}
                  onChange={(e) => setUpdatedComments(e.target.value)}
                  placeholder="e.g. Ordering physician alerted to addendum via telephone..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAmendModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-900/20 disabled:opacity-50"
                >
                  {submitting ? "Logging Amendment..." : "Issue & Certify Addendum"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
