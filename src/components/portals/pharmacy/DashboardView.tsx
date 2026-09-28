"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PrescriptionsIcon,
  DispensingIcon,
  MedicinesIcon,
  HistoryIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SearchIcon,
  RefreshIcon,
  LockIcon,
} from "./PharmacyIcons";

export function DashboardView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pharmacy/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load pharmacy dashboard");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Pharmacy Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <p className="font-semibold">Error: {error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, pendingPrescriptions, readyPrescriptions, lowStockMedicines, todayDispensing, recentActivity } = data;

  return (
    <div className="space-y-8">
      {/* Top Banner & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0D1E38] to-slate-900 border border-slate-800/80 p-6 rounded-2xl shadow-xl shadow-slate-950/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-teal-500/10 text-teal-400 border border-teal-500/20">
              DISPENSARY STATION #2
            </span>
            <span className="text-xs text-slate-400">• Active Shift</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Central Pharmacy Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Review doctor prescriptions, verify stock levels, and execute dispensing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-semibold transition-all hover:scale-102"
          >
            <RefreshIcon className="w-4 h-4 text-teal-400" />
            <span>Refresh Feed</span>
          </button>
          <Link
            href="/pharmacy/prescriptions"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-lg shadow-teal-900/30 transition-all hover:scale-102"
          >
            <PrescriptionsIcon className="w-4 h-4" />
            <span>Review Prescriptions</span>
          </Link>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Prescriptions */}
        <Link
          href="/pharmacy/prescriptions?status=pending"
          className="group relative overflow-hidden p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-900/80 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Pending Prescriptions
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <PrescriptionsIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats.pendingPrescriptionsCount}
          </div>
          <div className="mt-2 flex items-center text-xs text-amber-400/90 font-medium">
            <span>Awaiting pharmacist review</span>
          </div>
        </Link>

        {/* Ready for Dispensing */}
        <Link
          href="/pharmacy/prescriptions?status=ready"
          className="group relative overflow-hidden p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Ready for Dispensing
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats.readyForDispensingCount}
          </div>
          <div className="mt-2 flex items-center text-xs text-emerald-400/90 font-medium">
            <span>Stock verified & ready</span>
          </div>
        </Link>

        {/* Low Stock Medicines */}
        <Link
          href="/pharmacy/medicines?status=low_stock"
          className="group relative overflow-hidden p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 hover:border-rose-500/50 hover:bg-slate-900/80 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Low-Stock Medicines
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MedicinesIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-400 tracking-tight">
            {stats.lowStockMedicinesCount}
          </div>
          <div className="mt-2 flex items-center text-xs text-rose-400/90 font-medium">
            <span>Critical or below threshold</span>
          </div>
        </Link>

        {/* Today's Dispensing */}
        <Link
          href="/pharmacy/history?range=today"
          className="group relative overflow-hidden p-5 rounded-2xl bg-[#0A1324] border border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-900/80 transition-all shadow-md"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Today's Dispensing
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DispensingIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {stats.todayDispensingCount}
          </div>
          <div className="mt-2 flex items-center text-xs text-teal-400/90 font-medium">
            <span>Completed & in-progress</span>
          </div>
        </Link>
      </div>

      {/* TWO COLUMN GRID: Pending Prescriptions & Ready for Dispensing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Prescriptions */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h2 className="text-base font-bold text-white">Pending Prescriptions</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                {pendingPrescriptions.length}
              </span>
            </div>
            <Link
              href="/pharmacy/prescriptions"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              View All →
            </Link>
          </div>

          {pendingPrescriptions.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No pending prescriptions awaiting review.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPrescriptions.map((rx: any) => (
                <Link
                  key={rx._id}
                  href={`/pharmacy/prescriptions/${rx._id}`}
                  className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-800/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                          {rx.patientId?.name || "Patient"}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {rx.patientId?.mrn || "MRN"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dr. {rx.doctorId?.name || "Doctor"} • {rx.doctorId?.specialty || "General"}
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      Pending
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {rx.medications?.slice(0, 3).map((m: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium"
                      >
                        {m.medicine} ({m.dosage})
                      </span>
                    ))}
                    {rx.medications?.length > 3 && (
                      <span className="text-[11px] text-slate-400">
                        +{rx.medications.length - 3} more
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Ready for Dispensing */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h2 className="text-base font-bold text-white">Ready for Dispensing</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/20">
                {readyPrescriptions.length}
              </span>
            </div>
            <Link
              href="/pharmacy/prescriptions?status=ready"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              View All →
            </Link>
          </div>

          {readyPrescriptions.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No prescriptions currently ready for dispensing.
            </div>
          ) : (
            <div className="space-y-3">
              {readyPrescriptions.map((rx: any) => (
                <Link
                  key={rx._id}
                  href={`/pharmacy/prescriptions/${rx._id}`}
                  className="block p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {rx.patientId?.name || "Patient"}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {rx.patientId?.mrn || "MRN"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dr. {rx.doctorId?.name || "Doctor"} • {new Date(rx.date || rx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      Ready to Dispense
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {rx.medications?.length} prescribed medication{rx.medications?.length > 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold text-emerald-400 group-hover:underline">
                      Start Dispensing →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TWO COLUMN GRID: Low-Stock Medicines & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low-Stock Medicines */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <h2 className="text-base font-bold text-white">Low-Stock Alert Registry</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 font-semibold border border-rose-500/20">
                {lowStockMedicines.length} items
              </span>
            </div>
            <Link
              href="/pharmacy/medicines"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              Inventory Catalog →
            </Link>
          </div>

          {lowStockMedicines.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              All inventory levels are currently above reorder thresholds.
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockMedicines.map((med: any) => (
                <Link
                  key={med._id}
                  href={`/pharmacy/medicines/${med._id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 hover:bg-slate-800/40 transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{med.name}</span>
                    <span className="text-xs text-slate-400">
                      {med.category} • Location: {med.location || "Shelf"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${med.availableQuantity === 0 ? "text-rose-500" : "text-amber-400"}`}>
                        {med.availableQuantity} {med.unit}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Threshold: {med.lowStockThreshold} {med.unit}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        med.status === "out_of_stock"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}
                    >
                      {med.status === "out_of_stock" ? "Out of Stock" : "Low Stock"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity & Today's Dispensing */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              <h2 className="text-base font-bold text-white">Recent Activity & Audit</h2>
            </div>
            <Link
              href="/pharmacy/history"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
            >
              Full History →
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No recent dispensing activity recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {recentActivity.map((act: any) => (
                <div key={act.id} className="py-3 flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      act.type === "dispense"
                        ? "bg-teal-500/10 text-teal-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {act.type === "dispense" ? (
                      <DispensingIcon className="w-4 h-4" />
                    ) : (
                      <AlertTriangleIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{act.title}</p>
                    <p className="text-xs text-slate-400 truncate">{act.description}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(act.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
