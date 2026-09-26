"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconFlask,
  IconTestTube,
  IconBarcode,
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconUser,
  IconPlus,
  IconX,
  IconShield,
  IconSend,
} from "./LabIcons";

interface ParameterRow {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: "normal" | "high" | "low" | "critical";
}

interface ResultEntryProps {
  id: string;
}

export function ResultEntryView({ id }: ResultEntryProps) {
  const router = useRouter();
  const [test, setTest] = useState<any>(null);
  const [sample, setSample] = useState<any>(null);
  const [parameters, setParameters] = useState<ParameterRow[]>([]);
  const [technicianNotes, setTechnicianNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savingDraft, setSavingDraft] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lab/tests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTest(data.test);
        setSample(data.sample);
        setTechnicianNotes(data.test?.technicianNotes || "");

        // If test already has parameters saved, use them; otherwise use suggested defaultParameters
        if (data.test?.parameters && data.test.parameters.length > 0) {
          setParameters(data.test.parameters);
        } else if (data.defaultParameters && data.defaultParameters.length > 0) {
          setParameters(data.defaultParameters);
        } else {
          // Fallback single row
          setParameters([
            { name: "Result Parameter", value: "", unit: "mg/dL", referenceRange: "Normal", flag: "normal" },
          ]);
        }
      } else {
        setError("Failed to load test parameters");
      }
    } catch (err) {
      console.error(err);
      setError("Network error while loading test parameters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleParameterChange = (index: number, field: keyof ParameterRow, val: string) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: val };

    // Auto-detect high/low flag if numerical value and numeric range is specified
    if (field === "value") {
      const numVal = parseFloat(val);
      const range = updated[index].referenceRange;
      if (!isNaN(numVal) && range && range.includes("-")) {
        const parts = range.split("-").map((p) => parseFloat(p.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          if (numVal < parts[0]) {
            updated[index].flag = "low";
          } else if (numVal > parts[1]) {
            updated[index].flag = "high";
          } else {
            updated[index].flag = "normal";
          }
        }
      }
    }

    setParameters(updated);
  };

  const handleAddRow = () => {
    setParameters([
      ...parameters,
      { name: "", value: "", unit: "", referenceRange: "", flag: "normal" },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (parameters.length <= 1) return;
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/lab/tests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-draft",
          parameters,
          technicianNotes,
        }),
      });

      if (res.ok) {
        setSuccessMessage("Test result draft saved successfully. You can continue editing or submit when ready.");
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save draft");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitReview = async () => {
    // Validate that at least one parameter has a value
    const hasValues = parameters.some((p) => p.name.trim() !== "" && p.value.trim() !== "");
    if (!hasValues) {
      alert("Please enter at least one test parameter value before submitting.");
      return;
    }

    if (
      !confirm(
        "Submit calibrated test results for Pathologist Review? Note: Technicians do not finalize reports; the Pathologist will review and verify."
      )
    ) {
      return;
    }

    setSubmittingReview(true);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/lab/tests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit-review",
          parameters,
          technicianNotes,
        }),
      });

      if (res.ok) {
        setSuccessMessage("Test result submitted for Pathologist Review successfully.");
        setTimeout(() => {
          router.push("/lab/tests");
        }, 1200);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit result");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting result for review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading test parameters & calibration data...</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-4">
        <IconAlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Test Not Found</h2>
        <p className="text-sm text-slate-500">{error || "Could not retrieve the test file."}</p>
        <Link
          href="/lab/tests"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Tests
        </Link>
      </div>
    );
  }

  const isSubmitted = test.status === "submitted-for-review" || test.status === "verified";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/lab/tests"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#004ac6] transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Active Tests
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Report Ref:</span>
          <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
            {test.reportNumber}
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-medium animate-fade-in shadow-sm">
          <IconCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Test & Patient Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <IconFlask className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{test.testType}</h1>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {test.testCategory || "Laboratory Investigation"}
                </span>
                {test.priority === "stat" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                    STAT
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Ordered by: <span className="font-medium text-slate-800">{test.doctor?.name || "Dr. Staff Physician"}</span>
                {" • "}
                Status:{" "}
                <span className="font-semibold text-slate-700 uppercase text-xs">
                  {test.status?.replace("-", " ")}
                </span>
              </p>
            </div>
          </div>

          {/* Patient Quick Pill */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
              {test.patient?.name?.slice(0, 2).toUpperCase() || "PT"}
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{test.patient?.name || "Patient Record"}</div>
              <div className="text-xs text-slate-500">
                {test.patient?.age}y • {test.patient?.gender} • MRN: {test.patient?.id?.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Specimen Info Banner */}
        <div className="flex items-center justify-between bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-xs">
          <div className="flex items-center gap-3">
            <IconTestTube className="w-5 h-5 text-[#004ac6]" />
            <div>
              <span className="font-bold text-slate-800">Mounted Specimen: </span>
              <span className="font-mono font-semibold text-[#004ac6]">{sample?.sampleId || test.sampleCode || "SMP-2026-00125"}</span>
              <span className="text-slate-500 ml-2">
                ({sample?.containerType || "EDTA"}, {sample?.collectionVolume || "4.0 mL"})
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] bg-white border border-blue-200 px-2.5 py-1 rounded text-slate-600">
            <IconBarcode className="w-3.5 h-3.5 text-slate-400" />
            {sample?.barcode || `BC-${test.sampleCode || "SMP-2026-00125"}`}
          </div>
        </div>
      </div>

      {/* Result Entry Form */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Analyzed Parameters & Reference Values</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter measured diagnostic values, specify standard units, and verify calibrated biological reference ranges.
            </p>
          </div>
          {!isSubmitted && (
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#004ac6] hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
            >
              <IconPlus className="w-3.5 h-3.5" />
              Add Parameter Row
            </button>
          )}
        </div>

        {/* Parameters Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-3">Parameter Name</th>
                <th className="py-3 px-3 w-40">Observed Value</th>
                <th className="py-3 px-3 w-32">Unit</th>
                <th className="py-3 px-3 w-48">Reference Range</th>
                <th className="py-3 px-3 w-28 text-center">Status Flag</th>
                {!isSubmitted && <th className="py-3 px-2 w-12 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {parameters.map((param, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  {/* Parameter Name */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      value={param.name}
                      onChange={(e) => handleParameterChange(idx, "name", e.target.value)}
                      placeholder="e.g. Hemoglobin"
                      className="w-full px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none disabled:bg-slate-100 disabled:text-slate-600 font-medium"
                    />
                  </td>

                  {/* Value */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      value={param.value}
                      onChange={(e) => handleParameterChange(idx, "value", e.target.value)}
                      placeholder="e.g. 14.2"
                      className={`w-full px-2.5 py-1.5 text-sm font-bold bg-slate-50 border rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none disabled:bg-slate-100 ${
                        param.flag === "high" || param.flag === "low"
                          ? "border-amber-300 text-amber-900 bg-amber-50/30"
                          : "border-slate-200 text-slate-900"
                      }`}
                    />
                  </td>

                  {/* Unit */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      value={param.unit}
                      onChange={(e) => handleParameterChange(idx, "unit", e.target.value)}
                      placeholder="e.g. g/dL"
                      className="w-full px-2.5 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none disabled:bg-slate-100 text-slate-700"
                    />
                  </td>

                  {/* Reference Range */}
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      value={param.referenceRange}
                      onChange={(e) => handleParameterChange(idx, "referenceRange", e.target.value)}
                      placeholder="e.g. 13.5 - 17.5"
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none disabled:bg-slate-100 text-slate-600 font-mono"
                    />
                  </td>

                  {/* Flag indicator */}
                  <td className="py-2.5 px-3 text-center">
                    {param.flag === "high" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                        HIGH ↑
                      </span>
                    ) : param.flag === "low" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-800">
                        LOW ↓
                      </span>
                    ) : param.flag === "critical" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                        CRIT ⚠
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700">
                        Normal
                      </span>
                    )}
                  </td>

                  {/* Delete row */}
                  {!isSubmitted && (
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        disabled={parameters.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100 disabled:opacity-30"
                        title="Remove parameter"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Technician Notes Textarea */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">
            Technician Calibration & Quality Control Notes
          </label>
          <textarea
            rows={3}
            disabled={isSubmitted}
            value={technicianNotes}
            onChange={(e) => setTechnicianNotes(e.target.value)}
            placeholder="Record analyzer calibration details, specimen appearance (e.g. clear, lipemic, hemolyzed), or duplicate run notes..."
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none disabled:bg-slate-100 disabled:text-slate-600"
          />
        </div>

        {/* Pathologist Authority Reminder & Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs text-slate-700">
            <IconShield className="w-4 h-4 text-[#004ac6] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Clinical Responsibility Separation:</span>
              {" "}
              As a Laboratory Technician, your action is strictly to{" "}
              <span className="font-semibold text-[#004ac6]">Submit Result for Review</span>.
              Final diagnostic verification, pathology sign-off, and report release are performed solely by the
              authorized Pathologist.
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href="/lab/tests"
              className="text-xs font-medium text-slate-500 hover:text-slate-700"
            >
              Cancel and Return
            </Link>

            <div className="flex items-center gap-3">
              {!isSubmitted ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={savingDraft || submittingReview}
                    className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {savingDraft ? "Saving Draft..." : "Save Draft"}
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={submittingReview || savingDraft}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#004ac6] hover:bg-blue-700 rounded-xl transition-all shadow-md disabled:opacity-50"
                  >
                    <IconSend className="w-4 h-4" />
                    {submittingReview ? "Submitting..." : "Submit Result for Review"}
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                  Submitted for Pathologist Review
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
