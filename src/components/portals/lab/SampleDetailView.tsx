"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconTestTube,
  IconBarcode,
  IconClock,
  IconFlask,
  IconUser,
  IconCheckCircle,
  IconAlertTriangle,
  IconChevronRight,
} from "./LabIcons";

interface SampleDetailProps {
  id: string;
}

export function SampleDetailView({ id }: SampleDetailProps) {
  const [sample, setSample] = useState<any>(null);
  const [labReport, setLabReport] = useState<any>(null);
  const [chainOfCustody, setChainOfCustody] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit storage location state
  const [editingStorage, setEditingStorage] = useState(false);
  const [newStorage, setNewStorage] = useState("");
  const [savingStorage, setSavingStorage] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lab/samples/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSample(data.sample);
        setLabReport(data.labReport);
        setChainOfCustody(data.chainOfCustody || []);
        setNewStorage(data.sample?.storageLocation || "Station Rack A-1");
      } else {
        setError("Failed to load specimen details");
      }
    } catch (err) {
      console.error(err);
      setError("Network error while loading specimen");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStorage(true);
    try {
      const res = await fetch(`/api/lab/samples/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageLocation: newStorage }),
      });
      if (res.ok) {
        setEditingStorage(false);
        await loadData();
      } else {
        alert("Failed to update storage location");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating storage location");
    } finally {
      setSavingStorage(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading specimen chain of custody...</p>
      </div>
    );
  }

  if (error || !sample) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-4">
        <IconAlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Specimen Not Found</h2>
        <p className="text-sm text-slate-500">{error || "Could not retrieve the specimen file."}</p>
        <Link
          href="/lab/samples"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Samples
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/lab/samples"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#004ac6] transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Back to Specimens
        </Link>
        {labReport && (
          <Link
            href={`/lab/requests/${labReport.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#004ac6] hover:underline"
          >
            Go to Lab Order Details
            <IconChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Main Specimen Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
              <IconTestTube className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-mono font-bold text-slate-900">{sample.sampleId}</h1>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                  {sample.status?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Investigation:{" "}
                <span className="font-semibold text-slate-800">{labReport?.testType || "Laboratory Test"}</span>
                {" • "}
                Sample: <span className="font-medium text-slate-700">{sample.sampleType}</span>
              </p>
            </div>
          </div>

          {/* Barcode representation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center">
            <div className="flex items-center gap-1 py-1 px-3 bg-white border border-slate-300 rounded shadow-inner">
              <div className="h-8 w-1 bg-slate-800" />
              <div className="h-8 w-0.5 bg-slate-800" />
              <div className="h-8 w-2 bg-slate-800" />
              <div className="h-8 w-0.5 bg-slate-800" />
              <div className="h-8 w-1 bg-slate-800" />
              <div className="h-8 w-1.5 bg-slate-800" />
              <div className="h-8 w-0.5 bg-slate-800" />
              <div className="h-8 w-2 bg-slate-800" />
              <div className="h-8 w-1 bg-slate-800" />
            </div>
            <span className="text-[11px] font-mono text-slate-600 font-bold mt-1.5 tracking-wider">
              {sample.barcode}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">Secure Non-PHI Token</span>
          </div>
        </div>

        {/* Specimen Technical Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Container / Tube</div>
              <div className="font-semibold text-slate-800 text-base mt-1">{sample.containerType}</div>
              <div className="text-xs text-slate-500 mt-0.5">Recommended fill volume: 4.0 mL</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collection Volume</div>
              <div className="font-semibold text-slate-800 text-base mt-1">{sample.collectionVolume || "4.0 mL"}</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Collected At</div>
              <div className="font-semibold text-slate-800 text-sm mt-1">
                {sample.collectedAt ? new Date(sample.collectedAt).toLocaleString() : "Today"}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Phlebotomist: <span className="font-medium text-slate-700">{sample.collectedBy?.name || "Arun Kumar"}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Storage Rack</div>
              {editingStorage ? (
                <form onSubmit={handleUpdateStorage} className="mt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newStorage}
                    onChange={(e) => setNewStorage(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#004ac6] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingStorage}
                    className="px-2.5 py-1 bg-[#004ac6] text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingStorage(false)}
                    className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-slate-800 text-sm">{sample.storageLocation || "Station Rack A-1"}</span>
                  <button
                    onClick={() => setEditingStorage(true)}
                    className="text-xs text-[#004ac6] font-medium hover:underline"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <IconUser className="w-3.5 h-3.5 text-slate-500" />
              Patient Association
            </div>
            <div>
              <div className="font-bold text-slate-900">{sample.patient?.name || "Patient Record"}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {sample.patient?.age}y • {sample.patient?.gender}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-1">
                Ref ID: {sample.patient?.id?.slice(-8).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chain of Custody Timeline */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <IconClock className="w-4 h-4 text-slate-500" />
          Chain of Custody & Audit Log
        </h2>

        <div className="space-y-4 pl-2 border-l-2 border-blue-200 mt-4">
          {chainOfCustody.length === 0 ? (
            <div className="text-xs text-slate-500">No events recorded yet.</div>
          ) : (
            chainOfCustody.map((log, idx) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#004ac6] ring-4 ring-blue-50" />
                <div className="text-xs font-bold text-slate-900">{log.action}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  By {log.performedBy} • {new Date(log.timestamp).toLocaleString()}
                </div>
                {log.details && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1 max-w-lg">
                    {log.details}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
