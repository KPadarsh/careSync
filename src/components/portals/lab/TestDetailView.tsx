"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TestsIcon,
  BeakerIcon,
  CheckIcon,
  AlertTriangleIcon,
  ChevronRightIcon,
  BarcodeIcon,
  PrinterIcon,
} from "./LabIcons";

interface TestDetailViewProps {
  id: string;
}

interface ResultRow {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "normal" | "high" | "low" | "critical";
}

export const TestDetailView: React.FC<TestDetailViewProps> = ({ id }) => {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [results, setResults] = useState<ResultRow[]>([]);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [analyzerBench, setAnalyzerBench] = useState("");

  const fetchTestDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lab/tests/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load test workbench data");
      }
      const json = await res.json();
      setData(json.test);
      setResults(json.test.results || []);
      setTechnicianNotes(json.test.technicianNotes || "");
      setAnalyzerBench(json.test.analyzerBench || "Roche Cobas 6000 Chemistry Analyzer");
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestDetail();
  }, [id]);

  const updateResultRow = (index: number, field: keyof ResultRow, val: string) => {
    const updated = [...results];
    updated[index] = { ...updated[index], [field]: val };
    setResults(updated);
  };

  const addResultRow = () => {
    setResults([
      ...results,
      { parameter: "", value: "", unit: "", referenceRange: "", flag: "normal" },
    ]);
  };

  const removeResultRow = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const handleSubmitResults = async (action: "save" | "submit_for_review") => {
    try {
      setSubmitting(true);
      setSuccessMsg(null);

      const endpointAction =
        action === "submit_for_review" ? "submit_result_for_review" : "save_results";

      const res = await fetch(`/api/lab/tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: endpointAction,
          results,
          technicianNotes,
          analyzerBench,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to save results");
      }

      setSuccessMsg(resJson.message || "Results saved successfully.");
      await fetchTestDetail();

      if (action === "submit_for_review") {
        setTimeout(() => {
          router.push("/lab/completed");
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to update results");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Test Bench Data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangleIcon size={24} className="text-rose-600" />
          <span>{error || "Test record not found."}</span>
        </div>
        <Link
          href="/lab/tests"
          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
        >
          Back to Tests
        </Link>
      </div>
    );
  }

  const { patient, doctor } = data;
  const isSubmittedOrCompleted =
    data.status === "submitted_for_review" ||
    data.status === "verified" ||
    data.status === "finalized";

  return (
    <div className="flex flex-col gap-6">
      {/* BREADCRUMB NAVIGATION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/lab/dashboard" className="hover:text-[#00355f]">
            Lab
          </Link>
          <span>/</span>
          <Link href="/lab/tests" className="hover:text-[#00355f]">
            Tests
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{data.testName}</span>
        </div>

        <Link
          href="/lab/tests"
          className="text-xs font-semibold text-[#006a68] hover:underline"
        >
          ← Back to Tests Workbench
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckIcon size={16} className="text-teal-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>✕</button>
        </div>
      )}

      {/* HERO CARD */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-800 flex items-center justify-center font-bold">
              <BeakerIcon size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#00355f]">{data.testName}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-semibold capitalize">
                  {data.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Department: <strong>{data.department}</strong> • Bench: {analyzerBench}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {data.sampleId && (
              <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-bold flex items-center gap-1.5">
                <BarcodeIcon size={14} />
                <span>{data.sampleId}</span>
              </span>
            )}
          </div>
        </div>

        {/* PATIENT INFO STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient</span>
            <strong className="text-slate-900">{patient.name}</strong> ({patient.mrn})
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Demographics</span>
            <span>{patient.age}y • {patient.gender} • Blood: {patient.bloodGroup}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Requesting Doctor</span>
            <span className="text-slate-800">{doctor.name} ({doctor.specialty})</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Specimen Tube</span>
            <span className="text-slate-800">{data.sampleType || "Venous Blood"} ({data.tubeType || "Lavender EDTA"})</span>
          </div>
        </div>
      </div>

      {/* PERMISSION NOTICE BANNER */}
      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span>
            <strong>Technician Role Constraint:</strong> Result verification, pathology diagnostic interpretations, and final sign-off are reserved for Board Certified Pathologists.
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Action: Submit for Review
        </span>
      </div>

      {/* TEST RESULT ENTRY WORKBENCH */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <TestsIcon size={18} className="text-[#006a68]" />
            <h2 className="font-bold text-sm text-[#00355f]">Analytical Parameter Entry</h2>
          </div>

          {!isSubmittedOrCompleted && (
            <button
              type="button"
              onClick={addResultRow}
              className="text-xs font-semibold text-[#006a68] hover:underline"
            >
              + Add Parameter Row
            </button>
          )}
        </div>

        {/* PARAMETERS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Parameter Name</th>
                <th className="py-2.5 px-3 w-36">Test Value</th>
                <th className="py-2.5 px-3 w-28">Unit</th>
                <th className="py-2.5 px-3 w-52">Reference Range</th>
                <th className="py-2.5 px-3 w-36">Clinical Flag</th>
                {!isSubmittedOrCompleted && <th className="py-2.5 px-3 w-16 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      disabled={isSubmittedOrCompleted}
                      value={row.parameter}
                      onChange={(e) => updateResultRow(idx, "parameter", e.target.value)}
                      placeholder="Parameter name..."
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-medium focus:ring-1 focus:ring-[#0f4c81] disabled:bg-slate-50"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      disabled={isSubmittedOrCompleted}
                      value={row.value}
                      onChange={(e) => updateResultRow(idx, "value", e.target.value)}
                      placeholder="Enter value..."
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-900 font-bold focus:ring-1 focus:ring-[#0f4c81] disabled:bg-slate-50"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      disabled={isSubmittedOrCompleted}
                      value={row.unit}
                      onChange={(e) => updateResultRow(idx, "unit", e.target.value)}
                      placeholder="Unit..."
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-600 focus:ring-1 focus:ring-[#0f4c81] disabled:bg-slate-50"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      disabled={isSubmittedOrCompleted}
                      value={row.referenceRange}
                      onChange={(e) => updateResultRow(idx, "referenceRange", e.target.value)}
                      placeholder="Reference range..."
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-600 focus:ring-1 focus:ring-[#0f4c81] disabled:bg-slate-50"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select
                      disabled={isSubmittedOrCompleted}
                      value={row.flag}
                      onChange={(e) => updateResultRow(idx, "flag", e.target.value as any)}
                      className={`w-full p-1.5 border rounded font-semibold focus:ring-1 focus:ring-[#0f4c81] disabled:opacity-80 ${
                        row.flag === "critical"
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : row.flag === "high"
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : row.flag === "low"
                          ? "bg-blue-50 text-blue-800 border-blue-300"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High ↑</option>
                      <option value="low">Low ↓</option>
                      <option value="critical">Critical !!</option>
                    </select>
                  </td>
                  {!isSubmittedOrCompleted && (
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeResultRow(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove row"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BENCH & TECHNICIAN REMARKS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-2">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Active Instrument / Analyzer Bench
            </label>
            <input
              type="text"
              disabled={isSubmittedOrCompleted}
              value={analyzerBench}
              onChange={(e) => setAnalyzerBench(e.target.value)}
              className="w-full p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81] disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Technician Operational Notes
            </label>
            <textarea
              rows={2}
              disabled={isSubmittedOrCompleted}
              value={technicianNotes}
              onChange={(e) => setTechnicianNotes(e.target.value)}
              placeholder="Calibrations verified on automated carousel. Clean optical transmittance..."
              className="w-full p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81] disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* ACTION BAR: Submit Result for Review */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href="/lab/tests"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            ← Cancel &amp; Return
          </Link>

          {!isSubmittedOrCompleted && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => handleSubmitResults("save")}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Save Draft
              </button>

              {/* Action Required by Prompt: Submit Result for Review */}
              <button
                type="button"
                onClick={() => handleSubmitResults("submit_for_review")}
                disabled={submitting || results.length === 0}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#006a68] hover:bg-[#00504e] text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <CheckIcon size={16} />
                <span>Submit Result for Review</span>
              </button>
            </div>
          )}

          {isSubmittedOrCompleted && (
            <div className="p-2 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              ✓ Submitted for Pathologist Review (Awaiting pathologist verification)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
