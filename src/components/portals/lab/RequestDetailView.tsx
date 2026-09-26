"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconArrowLeft,
  IconFlask,
  IconTestTube,
  IconBarcode,
  IconClock,
  IconAlertTriangle,
  IconCheckCircle,
  IconChevronRight,
  IconUser,
  IconShield,
  IconPlus,
  IconX,
} from "./LabIcons";

interface RequestDetailProps {
  id: string;
}

export function RequestDetailView({ id }: RequestDetailProps) {
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [sample, setSample] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Collect Sample Modal State
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [sampleType, setSampleType] = useState("Blood (Whole)");
  const [containerType, setContainerType] = useState("Lavender (EDTA)");
  const [collectionVolume, setCollectionVolume] = useState("4.0 mL");
  const [storageLocation, setStorageLocation] = useState("Immediate Processing Rack A-1");
  const [collectionNotes, setCollectionNotes] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lab/requests/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRequest(data.request);
        setSample(data.sample);
      } else {
        setError("Failed to load request details");
      }
    } catch (err) {
      console.error(err);
      setError("Network error while loading request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleCollectSample = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/lab/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "collect-sample",
          sampleType,
          containerType,
          collectionVolume,
          storageLocation,
          notes: collectionNotes,
        }),
      });

      if (res.ok) {
        setShowCollectModal(false);
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to record sample");
      }
    } catch (err) {
      console.error(err);
      alert("Error recording sample");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleStartProcessing = async () => {
    if (!confirm("Confirm sample integrity and begin analyzer processing?")) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/lab/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-processing" }),
      });

      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to start processing");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting test processing");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading lab order details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-4">
        <IconAlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
        <p className="text-sm text-slate-500">{error || "Could not retrieve the requested lab investigation."}</p>
        <Link
          href="/lab/requests"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Lab Requests
        </Link>
      </div>
    );
  }

  const steps = [
    { key: "requested", label: "Requested" },
    { key: "sample-pending", label: "Sample Pending" },
    { key: "sample-collected", label: "Sample Collected" },
    { key: "processing", label: "Processing" },
    { key: "result-entered", label: "Result Entered" },
    { key: "submitted-for-review", label: "Submitted for Review" },
    { key: "verified", label: "Pathologist Verified" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === request.status);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Nav Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/lab/requests"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#004ac6] transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Requests
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Order Ref:</span>
          <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700">
            {request.reportNumber}
          </span>
        </div>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#004ac6] shrink-0">
              <IconFlask className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{request.testType}</h1>
                {request.priority === "stat" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                    STAT Priority
                  </span>
                ) : request.priority === "urgent" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Urgent
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    Routine
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Category: <span className="font-medium text-slate-700">{request.testCategory || "Diagnostic Pathology"}</span>
                {" • "}
                Ordered on:{" "}
                <span className="font-medium text-slate-700">
                  {request.requestedDate ? new Date(request.requestedDate).toLocaleString() : "Today"}
                </span>
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {(request.status === "requested" || request.status === "sample-pending") && (
              <button
                onClick={() => setShowCollectModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#004ac6] hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                <IconTestTube className="w-4 h-4" />
                Collect & Record Sample
              </button>
            )}

            {request.status === "sample-collected" && (
              <button
                onClick={handleStartProcessing}
                disabled={submittingAction}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <IconFlask className="w-4 h-4" />
                {submittingAction ? "Starting..." : "Begin Processing on Analyzer"}
              </button>
            )}

            {(request.status === "processing" || request.status === "result-entered") && (
              <Link
                href={`/lab/tests/${id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
              >
                <IconCheckCircle className="w-4 h-4" />
                {request.status === "result-entered" ? "Review & Submit Results" : "Enter Test Results"}
              </Link>
            )}

            {request.status === "submitted-for-review" && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold rounded-xl">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                Awaiting Pathologist Verification
              </div>
            )}
          </div>
        </div>

        {/* Workflow Progression Stepper */}
        <div className="pt-6">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Diagnostic Workflow Progress
          </div>
          <div className="relative">
            {/* Step Line */}
            <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
            <div
              className="hidden sm:block absolute top-4 left-6 h-0.5 bg-[#004ac6] transition-all duration-500 -z-0"
              style={{
                width: `${(activeStep / (steps.length - 1)) * 100}%`,
              }}
            />

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 relative z-10">
              {steps.map((step, idx) => {
                const isPassed = idx < activeStep;
                const isCurrent = idx === activeStep;
                return (
                  <div key={step.key} className="flex flex-col items-center text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        isPassed
                          ? "bg-[#004ac6] text-white"
                          : isCurrent
                          ? "bg-[#004ac6] text-white ring-4 ring-blue-100"
                          : "bg-white border-2 border-slate-300 text-slate-400"
                      }`}
                    >
                      {isPassed ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-xs font-medium mt-2 leading-tight ${
                        isCurrent
                          ? "text-[#004ac6] font-bold"
                          : isPassed
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Patient & Doctor Order Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Demographic Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <IconUser className="w-4 h-4 text-slate-500" />
              Patient Information
            </h2>
            <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              MRN: {request.patient?.mrn || request.patient?.id?.slice(-8).toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-400">Full Name</div>
              <div className="font-bold text-slate-900 text-base">{request.patient?.name || "Patient Record"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Age & Gender</div>
              <div className="font-semibold text-slate-800">
                {request.patient?.age || "—"} yrs • {request.patient?.gender || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Contact Number</div>
              <div className="font-medium text-slate-700">{request.patient?.phone || "+91 98765 43210"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Blood Group</div>
              <div className="font-semibold text-rose-600">{request.patient?.bloodGroup || "O Positive"}</div>
            </div>
          </div>
        </div>

        {/* Ordering Doctor Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <IconFlask className="w-4 h-4 text-slate-500" />
              Doctor Order & Clinical Notes
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {request.doctor?.department || "General Medicine"}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-slate-400">Ordering Physician</div>
              <div className="font-bold text-slate-900">{request.doctor?.name || "Dr. Staff Physician"}</div>
            </div>

            <div>
              <div className="text-xs text-slate-400">Clinical Indication / Reason</div>
              <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg text-xs leading-relaxed border border-slate-100 mt-1">
                {request.clinicalReason || "Diagnostic evaluation requested per routine clinical consultation protocol."}
              </p>
            </div>

            {request.instructions && (
              <div>
                <div className="text-xs text-slate-400">Doctor Instructions</div>
                <p className="text-slate-700 bg-amber-50/60 text-amber-900 p-2.5 rounded-lg text-xs border border-amber-100 mt-1">
                  {request.instructions}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Specimen / Sample Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <IconTestTube className="w-4 h-4 text-slate-500" />
            Specimen & Chain of Custody (LabSample)
          </h2>
          {sample && (
            <Link
              href={`/lab/samples/${sample.id}`}
              className="text-xs font-semibold text-[#004ac6] hover:underline flex items-center gap-1"
            >
              View Full Specimen File
              <IconChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {sample ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <div className="text-xs text-slate-400 font-medium">Sample Identifier</div>
              <div className="font-mono font-bold text-base text-slate-900 mt-0.5">{sample.sampleId}</div>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-slate-200 text-slate-600">
                  <IconBarcode className="w-3 h-3 text-slate-400" />
                  {sample.barcode}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium">Sample & Container</div>
              <div className="font-semibold text-slate-800 mt-0.5">{sample.sampleType}</div>
              <div className="text-xs text-slate-500">{sample.containerType}</div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium">Collection Volume & Loc</div>
              <div className="font-semibold text-slate-800 mt-0.5">{sample.collectionVolume || "4.0 mL"}</div>
              <div className="text-xs text-slate-500">{sample.storageLocation || "Station Rack A-1"}</div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium">Collected By & Time</div>
              <div className="font-semibold text-slate-800 mt-0.5">{sample.collectedBy?.name || "Arun Kumar"}</div>
              <div className="text-xs text-slate-500">
                {sample.collectedAt ? new Date(sample.collectedAt).toLocaleString() : "Today"}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-3">
            <IconTestTube className="w-8 h-8 text-amber-500 mx-auto" />
            <div>
              <p className="font-semibold text-slate-800 text-sm">Specimen Has Not Been Collected</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
                Prepare the phlebotomy collection kit according to standard test protocol and record the tube barcode.
              </p>
            </div>
            <button
              onClick={() => setShowCollectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#004ac6] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <IconPlus className="w-4 h-4" />
              Collect & Register Sample
            </button>
          </div>
        )}
      </div>

      {/* Permissions / Role Notice */}
      <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-3 text-xs text-slate-600">
        <IconShield className="w-5 h-5 text-[#004ac6] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Technician Authority Boundaries:</span> Lab Technicians record
          specimens, operate diagnostic analyzers, and submit calibrated results for review.
          <span className="font-semibold text-[#004ac6]"> Verification, clinical approval, and finalized pathology release</span>{" "}
          are strictly conducted by the Pathologist.
        </div>
      </div>

      {/* Collect Sample Modal */}
      {showCollectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004ac6] flex items-center justify-center">
                  <IconTestTube className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Collect & Record Specimen</h3>
                  <p className="text-xs text-slate-500">Record sample collection details and generate tube ID</p>
                </div>
              </div>
              <button
                onClick={() => setShowCollectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCollectSample} className="p-6 space-y-4">
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-xs text-slate-700">
                <div className="font-bold text-slate-900 mb-0.5">Sample Identifier Generation:</div>
                A unique <span className="font-mono font-semibold text-[#004ac6]">SMP-2026-XXXXX</span> identifier and
                secure barcode token will be assigned. No sensitive patient information is encoded in the barcode.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sample Type</label>
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none"
                >
                  <option value="Blood (Whole)">Blood (Whole)</option>
                  <option value="Serum">Serum</option>
                  <option value="Plasma">Plasma</option>
                  <option value="Urine (Clean Catch)">Urine (Clean Catch)</option>
                  <option value="Sputum">Sputum</option>
                  <option value="Nasopharyngeal Swab">Nasopharyngeal Swab</option>
                  <option value="Stool Specimen">Stool Specimen</option>
                  <option value="Synovial Fluid">Synovial Fluid</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Container / Vacutainer</label>
                  <select
                    value={containerType}
                    onChange={(e) => setContainerType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none"
                  >
                    <option value="Lavender (EDTA)">Lavender (EDTA)</option>
                    <option value="Gold (SST Gel)">Gold (SST Gel)</option>
                    <option value="Red (Plain Tube)">Red (Plain Tube)</option>
                    <option value="Light Blue (Sodium Citrate)">Light Blue (Sodium Citrate)</option>
                    <option value="Grey (Fluoride Oxalate)">Grey (Fluoride Oxalate)</option>
                    <option value="Green (Sodium Heparin)">Green (Sodium Heparin)</option>
                    <option value="Sterile Cup">Sterile Cup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Collection Volume</label>
                  <input
                    type="text"
                    value={collectionVolume}
                    onChange={(e) => setCollectionVolume(e.target.value)}
                    placeholder="e.g. 4.0 mL"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Storage / Analyzer Station Rack</label>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={(e) => setStorageLocation(e.target.value)}
                  placeholder="e.g. Immediate Processing Rack A-1"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phlebotomist / Collection Notes</label>
                <textarea
                  rows={2}
                  value={collectionNotes}
                  onChange={(e) => setCollectionNotes(e.target.value)}
                  placeholder="Optional specimen quality notes (e.g. slight hemolysis, fasting confirmed)..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-5 py-2 text-sm font-semibold text-white bg-[#004ac6] hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingAction ? "Recording..." : "Confirm Collection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
