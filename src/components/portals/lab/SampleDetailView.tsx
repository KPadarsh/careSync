"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  SamplesIcon,
  BarcodeIcon,
  PrinterIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  CheckIcon,
  ClockIcon,
} from "./LabIcons";

interface SampleDetailViewProps {
  id: string;
}

export const SampleDetailView: React.FC<SampleDetailViewProps> = ({ id }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable fields
  const [storageLocation, setStorageLocation] = useState("");
  const [sampleStatus, setSampleStatus] = useState("collected");
  const [notes, setNotes] = useState("");

  const fetchSample = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/lab/samples/${id}`);
      if (!res.ok) {
        throw new Error("Failed to load sample details");
      }
      const json = await res.json();
      setData(json.sample);
      setStorageLocation(json.sample.storageLocation || "Rack A-01 / Ambient");
      setSampleStatus(json.sample.status || "collected");
      setNotes(json.sample.technicianNotes || "");
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSample();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      setSuccessMsg(null);
      const res = await fetch(`/api/lab/samples/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageLocation,
          status: sampleStatus,
          technicianNotes: notes,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to update sample details");
      }
      setSuccessMsg("Sample storage location and status updated.");
      await fetchSample();
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintLabel = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Sample Specification...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangleIcon size={24} className="text-rose-600" />
          <span>{error || "Sample not found."}</span>
        </div>
        <Link
          href="/lab/samples"
          className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
        >
          Back to Samples
        </Link>
      </div>
    );
  }

  const { patient, doctor, report, chainOfCustody } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* BREADCRUMB NAVIGATION */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/lab/dashboard" className="hover:text-[#00355f]">
            Lab
          </Link>
          <span>/</span>
          <Link href="/lab/samples" className="hover:text-[#00355f]">
            Samples
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800">{data.sampleId}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintLabel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <PrinterIcon size={14} />
            <span>Print Barcode Label</span>
          </button>
          <Link
            href="/lab/samples"
            className="text-xs font-semibold text-[#006a68] hover:underline"
          >
            ← Back to Samples
          </Link>
        </div>
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

      {/* TOP SAMPLE HERO & PRINTABLE BARCODE LABEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SPECIMEN SUMMARY */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#006a68] flex items-center justify-center font-bold">
                  <SamplesIcon size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold font-mono text-[#00355f]">
                      {data.sampleId}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold uppercase">
                      {data.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{data.testName}</span>
                </div>
              </div>

              {report && (
                <Link
                  href={`/lab/requests/${report._id}`}
                  className="text-xs font-semibold text-[#006a68] hover:underline flex items-center gap-1"
                >
                  <span>Open Requisition</span>
                  <ChevronRightIcon size={14} />
                </Link>
              )}
            </div>

            {/* Specimen Specifications */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Specimen Type
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {data.specimenType}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Collection Tube
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {data.tubeType}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Volume
                </span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {data.volume || "4.0 mL"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Storage Rack
                </span>
                <span className="font-mono font-bold text-teal-800 mt-0.5 block">
                  {data.storageLocation}
                </span>
              </div>
            </div>

            {/* Patient & Doctor Context */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Patient: </span>
                <strong className="text-slate-800">{patient?.name}</strong>{" "}
                ({patient?.mrn} • {patient?.bloodGroup})
              </div>
              <div>
                <span className="text-slate-400">Doctor: </span>
                <strong className="text-slate-800">{doctor?.name}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* PRINTABLE BARCODE LABEL (Pure SVG, NO PATIENT PII ENCODED) */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col items-center justify-between text-center">
          <div className="w-full flex items-center justify-between pb-2 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
            <span>BARCODE PRINT PREVIEW</span>
            <span className="text-teal-700">2x1 Direct Thermal</span>
          </div>

          {/* Barcode Sticker Simulation */}
          <div className="my-4 p-4 rounded-lg border-2 border-dashed border-slate-300 bg-white w-full max-w-[280px] shadow-2xs flex flex-col items-center">
            <span className="text-[11px] font-bold tracking-tight text-slate-800 uppercase">
              CareSync Pathology Lab
            </span>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">
              TOKEN: {data.barcodeToken}
            </span>

            {/* High fidelity SVG 1D Barcode */}
            <div className="my-2 bg-white py-1">
              <svg width="220" height="42" viewBox="0 0 220 42" className="text-slate-900">
                <line x1="10" y1="0" x2="10" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="0" x2="16" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="22" y1="0" x2="22" y2="42" stroke="currentColor" strokeWidth="4" />
                <line x1="30" y1="0" x2="30" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="36" y1="0" x2="36" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="42" y1="0" x2="42" y2="42" stroke="currentColor" strokeWidth="3" />
                <line x1="48" y1="0" x2="48" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="56" y1="0" x2="56" y2="42" stroke="currentColor" strokeWidth="4" />
                <line x1="64" y1="0" x2="64" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="72" y1="0" x2="72" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="78" y1="0" x2="78" y2="42" stroke="currentColor" strokeWidth="3" />
                <line x1="86" y1="0" x2="86" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="94" y1="0" x2="94" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="100" y1="0" x2="100" y2="42" stroke="currentColor" strokeWidth="4" />
                <line x1="108" y1="0" x2="108" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="116" y1="0" x2="116" y2="42" stroke="currentColor" strokeWidth="3" />
                <line x1="124" y1="0" x2="124" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="130" y1="0" x2="130" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="136" y1="0" x2="136" y2="42" stroke="currentColor" strokeWidth="4" />
                <line x1="144" y1="0" x2="144" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="152" y1="0" x2="152" y2="42" stroke="currentColor" strokeWidth="3" />
                <line x1="160" y1="0" x2="160" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="166" y1="0" x2="166" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="174" y1="0" x2="174" y2="42" stroke="currentColor" strokeWidth="4" />
                <line x1="182" y1="0" x2="182" y2="42" stroke="currentColor" strokeWidth="2" />
                <line x1="190" y1="0" x2="190" y2="42" stroke="currentColor" strokeWidth="3" />
                <line x1="198" y1="0" x2="198" y2="42" stroke="currentColor" strokeWidth="1" />
                <line x1="206" y1="0" x2="206" y2="42" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-700 px-2 mt-1">
              <span>{data.sampleId}</span>
              <span>{data.specimenType.substring(0, 10)}</span>
              <span>{new Date(data.collectedAt).toLocaleDateString()}</span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400">
            Complies with HIPAA safe harbor: Barcode only identifies unique token, no patient PII.
          </span>
        </div>
      </div>

      {/* CHAIN OF CUSTODY TIMELINE & EDIT STORAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHAIN OF CUSTODY */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 shadow-xs p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ClockIcon size={18} className="text-[#006a68]" />
            <h2 className="font-bold text-sm text-[#00355f]">Chain of Custody Audit Log</h2>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {chainOfCustody?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    item.status === "completed"
                      ? "bg-teal-100 text-[#006a68]"
                      : item.status === "in-progress"
                      ? "bg-purple-100 text-purple-700 animate-pulse"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {item.status === "completed" ? "✓" : idx + 1}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{item.step}</span>
                    <span className="text-[10px] text-slate-400">
                      {item.time ? new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Pending"}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 mt-0.5">
                    Actor: {item.actor} • Location: {item.location}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">{item.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* UPDATE SAMPLE STORAGE & STATUS */}
        <form
          onSubmit={handleUpdate}
          className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-5 flex flex-col gap-4"
        >
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-sm text-[#00355f]">Update Storage Location</h2>
            <p className="text-xs text-slate-500">Manage specimen location in laboratory archive.</p>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <label className="font-semibold text-slate-700">Storage Rack / Unit</label>
            <input
              type="text"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              className="p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 font-mono focus:ring-1 focus:ring-[#0f4c81]"
            />
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <label className="font-semibold text-slate-700">Specimen Status</label>
            <select
              value={sampleStatus}
              onChange={(e) => setSampleStatus(e.target.value)}
              className="p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-[#0f4c81]"
            >
              <option value="collected">Collected (Accessioned)</option>
              <option value="processing">Processing on Carousel</option>
              <option value="analyzed">Analyzed (Completed Run)</option>
              <option value="stored">Cold Stored (Archived 4°C)</option>
              <option value="disposed">Disposed (Biohazard Protocol)</option>
              <option value="rejected">Rejected (Pre-analytical failure)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <label className="font-semibold text-slate-700">Technician Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Storage rack notes or specimen condition..."
              className="p-2 bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-[#0f4c81]"
            />
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full py-2 bg-[#00355f] hover:bg-[#0f4c81] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            {updating ? "Saving..." : "Save Location & Status"}
          </button>
        </form>
      </div>
    </div>
  );
};
