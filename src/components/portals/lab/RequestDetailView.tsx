"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RequestsIcon,
  SamplesIcon,
  TestsIcon,
  CompletedIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckIcon,
  ChevronRightIcon,
  BarcodeIcon,
  BeakerIcon,
  PrinterIcon,
  UserIcon,
} from "./LabIcons";

interface RequestDetailViewProps {
  id: string;
}

interface ResultRow {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: "normal" | "high" | "low" | "critical";
}

export const RequestDetailView: React.FC<RequestDetailViewProps> = ({ id }) => {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Sample Collection state
  const [specimenType, setSpecimenType] = useState("Venous Blood");
  const [tubeType, setTubeType] = useState("Lavender Top (EDTA)");
  const [collectionSite, setCollectionSite] = useState("Station 2 Phlebotomy");
  const [sampleVolume, setSampleVolume] = useState("4.0 mL");
  const [collectionNotes, setCollectionNotes] = useState("");

  // Processing state
  const [analyzerBench, setAnalyzerBench] = useState("Roche Cobas 6000 Chemistry Analyzer");
  const [processingNotes, setProcessingNotes] = useState("");

  // Result entry state
  const [results, setResults] = useState<ResultRow[]>([]);
  const [technicianNotes, setTechnicianNotes] = useState("");

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lab/requests/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load requisition details");
      }
      const json = await res.json();
      setData(json.request);
      setTechnicianNotes(json.request.technicianNotes || "");
      if (json.request.results && json.request.results.length > 0) {
        setResults(json.request.results);
      } else {
        // Pre-fill standard templates for common tests
        const testName = json.request.testName.toLowerCase();
        if (testName.includes("troponin") || testName.includes("cardiac")) {
          setResults([
            { parameter: "High-Sensitivity Troponin I", value: "", unit: "ng/L", referenceRange: "< 14.0 (Normal), > 26.0 (Elevated)", flag: "normal" },
            { parameter: "CK-MB Isoenzyme", value: "", unit: "ng/mL", referenceRange: "0.0 - 5.0", flag: "normal" },
            { parameter: "Myoglobin", value: "", unit: "ng/mL", referenceRange: "28 - 72", flag: "normal" },
          ]);
        } else if (testName.includes("cbc") || testName.includes("blood count")) {
          setResults([
            { parameter: "Hemoglobin", value: "", unit: "g/dL", referenceRange: "13.5 - 17.5", flag: "normal" },
            { parameter: "White Blood Cells (WBC)", value: "", unit: "x10³/µL", referenceRange: "4.5 - 11.0", flag: "normal" },
            { parameter: "Platelet Count", value: "", unit: "x10³/µL", referenceRange: "150 - 450", flag: "normal" },
            { parameter: "Hematocrit (HCT)", value: "", unit: "%", referenceRange: "38.8 - 50.0", flag: "normal" },
          ]);
        } else if (testName.includes("lipid") || testName.includes("cholesterol")) {
          setResults([
            { parameter: "Total Cholesterol", value: "", unit: "mg/dL", referenceRange: "< 200 (Desirable)", flag: "normal" },
            { parameter: "Triglycerides", value: "", unit: "mg/dL", referenceRange: "< 150 (Normal)", flag: "normal" },
            { parameter: "HDL Cholesterol", value: "", unit: "mg/dL", referenceRange: "> 40 (Normal)", flag: "normal" },
            { parameter: "LDL Cholesterol", value: "", unit: "mg/dL", referenceRange: "< 100 (Optimal)", flag: "normal" },
          ]);
        } else {
          setResults([
            { parameter: `${json.request.testName} Primary Assay`, value: "", unit: "Index / Value", referenceRange: "Normal Range", flag: "normal" },
          ]);
        }
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleAction = async (action: string, payload: any = {}) => {
    try {
      setSubmittingAction(true);
      setActionSuccessMsg(null);
      const res = await fetch(`/api/lab/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Action failed");
      }

      setActionSuccessMsg(resJson.message || "Action updated successfully.");
      await fetchDetail();
    } catch (err: any) {
      setError(err.message || "Failed to execute action");
    } finally {
      setSubmittingAction(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Requisition Details...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangleIcon size={24} className="text-rose-600" />
          <span>{error || "Requisition not found."}</span>
        </div>
        <Link
          href="/lab/requests"
          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
        >
          Back to Requests
        </Link>
      </div>
    );
  }

  const { patient, doctor, sample } = data;
  const currentStatus = data.status?.toLowerCase();

  // Status step progression calculation
  const statusSteps = [
    { key: "requested", label: "Requested" },
    { key: "sample_pending", label: "Sample Pending" },
    { key: "sample_collected", label: "Sample Collected" },
    { key: "processing", label: "Processing" },
    { key: "result_entered", label: "Result Entered" },
    { key: "submitted_for_review", label: "Submitted for Review" },
    { key: "verified", label: "Pathologist" },
  ];

  const getStepIndex = (st: string) => {
    if (st === "pending") return 0;
    if (st === "in-progress") return 3;
    if (st === "finalized") return 6;
    const idx = statusSteps.findIndex((s) => s.key === st);
    return idx >= 0 ? idx : 0;
  };

  const currentStepIdx = getStepIndex(currentStatus);

  return (
    <div className="flex flex-col gap-6">
      {/* BREADCRUMB NAVIGATION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/lab/dashboard" className="hover:text-[#00355f]">
            Lab
          </Link>
          <span>/</span>
          <Link href="/lab/requests" className="hover:text-[#00355f]">
            Requests
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{data.testName}</span>
        </div>

        <Link
          href="/lab/requests"
          className="text-xs font-semibold text-[#006a68] hover:underline flex items-center gap-1"
        >
          ← Back to Requests
        </Link>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckIcon size={16} className="text-teal-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg(null)}
            className="text-teal-600 hover:text-teal-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* PATIENT & REQUISITION HERO CARD */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00355f] text-white flex items-center justify-center font-bold text-base flex-shrink-0">
              {patient.bloodGroup || "O+"}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-[#00355f]">{patient.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-semibold">
                  {patient.mrn}
                </span>
                {data.priority === "stat" ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold uppercase animate-pulse">
                    STAT Priority
                  </span>
                ) : data.priority === "urgent" ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase">
                    Urgent
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase">
                    Routine
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                <span>{patient.age} years old</span>
                <span>•</span>
                <span className="capitalize">{patient.gender}</span>
                <span>•</span>
                <span>Blood: <strong>{patient.bloodGroup}</strong></span>
                <span>•</span>
                <span>Tel: {patient.phone}</span>
              </div>
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-semibold text-rose-700">Allergies:</span>
                  <div className="flex gap-1 flex-wrap">
                    {patient.allergies.map((allg: string) => (
                      <span
                        key={allg}
                        className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-medium"
                      >
                        {allg}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DOCTOR INFO BADGE */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex flex-col gap-1 min-w-[240px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Requesting Physician
            </span>
            <span className="text-xs font-bold text-slate-800">{doctor.name}</span>
            <span className="text-[11px] text-slate-500">
              {doctor.specialty} • {doctor.department}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Ordered: {new Date(data.requestedDate).toLocaleDateString()} at{" "}
              {new Date(data.requestedDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* CLINICAL SUMMARY */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1 text-xs">
          <span className="font-semibold text-slate-700">Clinical Indication / Summary:</span>
          <p className="text-slate-600 bg-[#f8f9fe] p-2.5 rounded-lg border border-slate-200/80">
            {data.summary || "Routine diagnostic evaluation."}
          </p>
        </div>
      </div>

      {/* STATUS FLOW PROGRESS BAR (Strictly following prompt) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
          Workflow Progression
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {statusSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div
                key={step.key}
                className={`p-2.5 rounded-lg border text-center flex flex-col items-center gap-1 transition-all ${
                  isCurrent
                    ? "bg-[#00355f] text-white border-[#00355f] shadow-xs font-bold"
                    : isCompleted
                    ? "bg-teal-50 border-teal-200 text-teal-800 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-400 font-medium"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isCurrent
                      ? "bg-white text-[#00355f]"
                      : isCompleted
                      ? "bg-[#006a68] text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? "✓" : idx + 1}
                </div>
                <span className="text-[11px] leading-tight">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* PERMISSIONS DISCLAIMER */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-800">
          <ClockIcon size={18} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold">Technician Authorization Level</span>
          <span className="text-blue-800/80">
            You may collect specimens, record sample identifiers, execute instrument analysis, and submit results for review.
            Pathology verification and final sign-off belong exclusively to Board Certified Pathologist Dr. Sunita Patil, MD.
          </span>
        </div>
      </div>

      {/* STEP 1 & 2: SAMPLE COLLECTION & BARCODE ACCREDITATION */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#006a68] flex items-center justify-center">
              <SamplesIcon size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#00355f]">
                Specimen Collection &amp; Sample Management
              </h2>
              <p className="text-xs text-slate-500">
                Collect sample, generate standardized SMP-2026 identifier, and attach secure barcode.
              </p>
            </div>
          </div>

          {data.sampleId && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 text-xs font-mono font-bold">
              <BarcodeIcon size={14} />
              {data.sampleId}
            </span>
          )}
        </div>

        {/* Existing Sample Card or Collection Form */}
        {data.sample ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Sample Identifier
              </span>
              <span className="font-mono font-bold text-sm text-[#00355f]">
                {data.sample.sampleId}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Specimen / Tube
              </span>
              <span className="font-semibold text-slate-800">
                {data.sample.specimenType} ({data.sample.tubeType})
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Secure Barcode Token
              </span>
              <span className="font-mono text-slate-700">
                {data.sample.barcode}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">
                Storage Location
              </span>
              <span className="font-semibold text-slate-800">
                {data.sample.storageLocation}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Specimen Type
              </label>
              <select
                value={specimenType}
                onChange={(e) => setSpecimenType(e.target.value)}
                className="w-full bg-[#f8f9fe] border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              >
                <option value="Venous Blood">Venous Blood</option>
                <option value="Serum">Serum</option>
                <option value="Plasma">Plasma</option>
                <option value="Whole Blood (EDTA)">Whole Blood (EDTA)</option>
                <option value="Urine (Clean Catch)">Urine (Clean Catch)</option>
                <option value="Cerebrospinal Fluid (CSF)">CSF</option>
                <option value="Nasopharyngeal Swab">Nasopharyngeal Swab</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Collection Tube
              </label>
              <select
                value={tubeType}
                onChange={(e) => setTubeType(e.target.value)}
                className="w-full bg-[#f8f9fe] border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              >
                <option value="Lavender Top (EDTA)">Lavender Top (EDTA)</option>
                <option value="Gold Top (SST)">Gold Top (SST / Gel Separator)</option>
                <option value="Light Blue (Sodium Citrate)">Light Blue (Sodium Citrate)</option>
                <option value="Red Top (Plain)">Red Top (Plain Glass/Plastic)</option>
                <option value="Gray Top (Sodium Fluoride)">Gray Top (Sodium Fluoride)</option>
                <option value="Green Top (Lithium Heparin)">Green Top (Heparin)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Collection Bay / Site
              </label>
              <input
                type="text"
                value={collectionSite}
                onChange={(e) => setCollectionSite(e.target.value)}
                className="w-full bg-[#f8f9fe] border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Volume
              </label>
              <input
                type="text"
                value={sampleVolume}
                onChange={(e) => setSampleVolume(e.target.value)}
                className="w-full bg-[#f8f9fe] border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="font-semibold text-slate-700 block mb-1">
                Technician Phlebotomy Notes
              </label>
              <input
                type="text"
                placeholder="Sample drawn smoothly without hemolysis or prolonged stasis..."
                value={collectionNotes}
                onChange={(e) => setCollectionNotes(e.target.value)}
                className="w-full bg-[#f8f9fe] border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() =>
                  handleAction("collect_sample", {
                    specimenType,
                    tubeType,
                    collectionSite,
                    volume: sampleVolume,
                    notes: collectionNotes,
                  })
                }
                disabled={submittingAction}
                className="w-full py-2 bg-[#006a68] hover:bg-[#00504e] text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <BarcodeIcon size={15} />
                <span>{submittingAction ? "Recording..." : "Collect & Record Sample"}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: BEGIN PROCESSING / ANALYZER BENCH */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <TestsIcon size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#00355f]">
                Analytical Instrument Bench
              </h2>
              <p className="text-xs text-slate-500">
                Assign diagnostic analyzer carousel and begin automated testing run.
              </p>
            </div>
          </div>

          {data.analyzerBench && (
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
              {data.analyzerBench}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700 block mb-1">
              Select Analyzer / Bench Station
            </label>
            <select
              value={analyzerBench}
              onChange={(e) => setAnalyzerBench(e.target.value)}
              className="w-full bg-[#f8f9fe] border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
            >
              <option value="Roche Cobas 6000 Chemistry Analyzer">Roche Cobas 6000 Chemistry Analyzer</option>
              <option value="Sysmex XN-1000 Automated Hematology">Sysmex XN-1000 Automated Hematology</option>
              <option value="Beckman Coulter Access 2 Immunoassay">Beckman Coulter Access 2 Immunoassay</option>
              <option value="Bio-Rad D-100 Hemoglobin Testing System">Bio-Rad D-100 Hemoglobin Testing System</option>
              <option value="Manual Microscopy & Coagulation Bench 3">Manual Microscopy &amp; Coagulation Bench 3</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() =>
                handleAction("begin_processing", {
                  analyzerBench,
                  notes: processingNotes,
                })
              }
              disabled={submittingAction || currentStatus === "submitted_for_review" || currentStatus === "verified"}
              className="w-full py-2 bg-[#00355f] hover:bg-[#0f4c81] text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <TestsIcon size={15} />
              <span>{submittingAction ? "Updating..." : "Begin Processing"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* STEP 4: TEST RESULT ENTRY STATION */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-800 flex items-center justify-center">
              <BeakerIcon size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#00355f]">
                Test Result Entry Station
              </h2>
              <p className="text-xs text-slate-500">
                Enter test values, units, reference ranges, flags, and technician operational notes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addResultRow}
            className="text-xs font-semibold text-[#006a68] hover:underline flex items-center gap-1"
          >
            + Add Parameter Row
          </button>
        </div>

        {/* RESULTS TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">Test Parameter</th>
                <th className="py-2.5 px-3 w-32">Value</th>
                <th className="py-2.5 px-3 w-28">Unit</th>
                <th className="py-2.5 px-3 w-48">Reference Range</th>
                <th className="py-2.5 px-3 w-32">Flag</th>
                <th className="py-2.5 px-3 w-16 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.parameter}
                      onChange={(e) => updateResultRow(idx, "parameter", e.target.value)}
                      placeholder="Parameter name..."
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-800 font-medium focus:ring-1 focus:ring-[#0f4c81]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.value}
                      onChange={(e) => updateResultRow(idx, "value", e.target.value)}
                      placeholder="e.g. 14.2"
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-900 font-bold focus:ring-1 focus:ring-[#0f4c81]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateResultRow(idx, "unit", e.target.value)}
                      placeholder="e.g. mg/dL"
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-600 focus:ring-1 focus:ring-[#0f4c81]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={row.referenceRange}
                      onChange={(e) => updateResultRow(idx, "referenceRange", e.target.value)}
                      placeholder="e.g. 70 - 99"
                      className="w-full p-1.5 bg-white border border-slate-200 rounded text-slate-600 focus:ring-1 focus:ring-[#0f4c81]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={row.flag}
                      onChange={(e) => updateResultRow(idx, "flag", e.target.value as any)}
                      className={`w-full p-1.5 border rounded font-semibold focus:ring-1 focus:ring-[#0f4c81] ${
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TECHNICIAN NOTES */}
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-semibold text-slate-700">
            Technician Notes &amp; Instrument Calibration Remarks
          </label>
          <textarea
            rows={2}
            value={technicianNotes}
            onChange={(e) => setTechnicianNotes(e.target.value)}
            placeholder="Specimen integrity confirmed. Two-point calibration run verified within ±1 SD. Telemetry linked to Station 2 database..."
            className="w-full p-2.5 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0f4c81]"
          />
        </div>

        {/* ACTION BUTTONS (Notice: Submit Result for Review only; No Verify/Approve/Finalize) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              handleAction("save_results", {
                results,
                technicianNotes,
              })
            }
            disabled={submittingAction || currentStatus === "submitted_for_review" || currentStatus === "verified"}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Save Draft Results
          </button>

          {/* Action Required by prompt: Submit Result for Review */}
          <button
            type="button"
            onClick={() =>
              handleAction("submit_result_for_review", {
                results,
                technicianNotes,
              })
            }
            disabled={submittingAction || results.length === 0 || currentStatus === "submitted_for_review" || currentStatus === "verified"}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#006a68] hover:bg-[#00504e] text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckIcon size={16} />
            <span>Submit Result for Review</span>
          </button>
        </div>
      </div>
    </div>
  );
};
