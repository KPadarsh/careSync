"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MedicinesIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
  DispensingIcon,
} from "./PharmacyIcons";

interface MedicineDetailViewProps {
  id: string;
}

export function MedicineDetailView({ id }: MedicineDetailViewProps) {
  const [medicine, setMedicine] = useState<any>(null);
  const [dispensingHistory, setDispensingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit / Restock fields
  const [adjustQty, setAdjustQty] = useState(50);
  const [location, setLocation] = useState("");
  const [threshold, setThreshold] = useState(20);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pharmacy/medicines/${id}`);
      if (!res.ok) throw new Error("Failed to load medicine details");
      const data = await res.json();
      setMedicine(data.medicine);
      setDispensingHistory(data.dispensingHistory || []);
      if (data.medicine) {
        setLocation(data.medicine.location || "");
        setThreshold(data.medicine.lowStockThreshold || 20);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load medicine details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStockAdjustment = async (delta: number) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pharmacy/medicines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockAdjustment: delta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setFeedback({ type: "success", text: `Stock adjusted by ${delta > 0 ? "+" : ""}${delta} units.` });
      await fetchDetail();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Adjustment failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/pharmacy/medicines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          lowStockThreshold: threshold,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setFeedback({ type: "success", text: "Medicine location & threshold updated." });
      await fetchDetail();
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Save failed." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Medicine Record...</p>
        </div>
      </div>
    );
  }

  if (error || !medicine) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <p className="font-semibold">{error || "Medicine not found"}</p>
        <Link
          href="/pharmacy/medicines"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Medicines</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/pharmacy/medicines"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Formulary Catalog</span>
        </Link>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            medicine.status === "in_stock"
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              : medicine.status === "low_stock"
              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
              : "bg-rose-500/10 text-rose-300 border border-rose-500/20"
          }`}
        >
          {medicine.status.replace("_", " ")}
        </span>
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

      {/* Hero Overview */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 shadow-xl shadow-slate-950/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
                {medicine.category}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-mono">
                Location: {medicine.location || "Shelf A-01"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
              {medicine.name}
            </h1>
            {medicine.genericName && (
              <p className="text-sm text-slate-400 italic mt-0.5">
                Generic: {medicine.genericName}
              </p>
            )}
            {medicine.description && (
              <p className="text-xs text-slate-300 mt-2 max-w-xl">
                {medicine.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-6 bg-[#08101E] px-6 py-4 rounded-2xl border border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Available Stock
              </span>
              <span
                className={`text-3xl font-extrabold font-mono ${
                  medicine.availableQuantity === 0
                    ? "text-rose-400"
                    : medicine.availableQuantity <= medicine.lowStockThreshold
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {medicine.availableQuantity}
              </span>
              <span className="text-xs text-slate-400 font-medium ml-1">
                {medicine.unit}
              </span>
            </div>

            <div className="h-10 w-px bg-slate-800" />

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Low Threshold
              </span>
              <span className="text-xl font-bold text-slate-300 font-mono">
                {medicine.lowStockThreshold}
              </span>
              <span className="text-xs text-slate-400 ml-1">
                {medicine.unit}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Restock / Stock Adjustments */}
        <div className="mt-6 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-300 font-semibold">
            Quick Dispensary Stock Adjustments:
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleStockAdjustment(10)}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              +10 {medicine.unit}
            </button>
            <button
              onClick={() => handleStockAdjustment(50)}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              +50 {medicine.unit}
            </button>
            <button
              onClick={() => handleStockAdjustment(100)}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              +100 {medicine.unit}
            </button>
            <button
              onClick={() => handleStockAdjustment(-10)}
              disabled={actionLoading || medicine.availableQuantity < 10}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              -10 (Damage/Audit)
            </button>
          </div>
        </div>
      </div>

      {/* Threshold and Location Settings Form */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Location & Threshold Configuration
        </h3>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Dispensary Shelf / Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Low-Stock Alert Threshold ({medicine.unit})
            </label>
            <input
              type="number"
              min="1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-teal-500/30 transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Recent Dispensing Records for this medicine */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Dispensing History For This Medicine
          </h3>
          <span className="text-xs text-slate-400">
            {dispensingHistory.length} record{dispensingHistory.length > 1 ? "s" : ""}
          </span>
        </div>

        {dispensingHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No dispensing history recorded yet for this medicine.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {dispensingHistory.map((d: any) => (
              <div key={d._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-teal-400 mr-2">
                    {d.dispenseId}
                  </span>
                  <span className="font-bold text-white">
                    {d.patientId?.name || "Patient"}
                  </span>
                  <span className="text-slate-400 ml-2">
                    (Dr. {d.doctorId?.name || "Doctor"})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono">
                    {new Date(d.dispensedDate || d.createdAt).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/pharmacy/dispensing/${d._id}`}
                    className="text-teal-400 hover:underline font-semibold"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
