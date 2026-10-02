"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import {
  PrescriptionsIcon,
  DispensingIcon,
  MedicinesIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
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
          <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading Pharmacy Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
        <p className="font-semibold text-sm">Error: {error}</p>
        <button
          onClick={fetchDashboard}
          className="mt-3 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, pendingPrescriptions, readyPrescriptions, lowStockMedicines, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Central Pharmacy Dashboard"
        description="Review doctor prescriptions, verify stock levels, and execute dispensing."
        badge={
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/80">
            Station B-2 Active
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchDashboard}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
            <Link
              href="/pharmacy/prescriptions"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <PrescriptionsIcon className="w-4 h-4" />
              <span>Review Prescriptions</span>
            </Link>
          </div>
        }
      />

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Prescriptions */}
        <Link href="/pharmacy/prescriptions?status=pending">
          <StatCard
            title="Pending Prescriptions"
            value={stats.pendingPrescriptionsCount}
            subtext="Awaiting pharmacist review"
            icon={
              <div className="text-amber-600">
                <PrescriptionsIcon className="w-4 h-4" />
              </div>
            }
          />
        </Link>

        {/* Ready for Dispensing */}
        <Link href="/pharmacy/prescriptions?status=ready">
          <StatCard
            title="Ready for Dispensing"
            value={stats.readyForDispensingCount}
            subtext="Stock verified & ready"
            icon={
              <div className="text-emerald-600">
                <CheckCircleIcon className="w-4 h-4" />
              </div>
            }
          />
        </Link>

        {/* Low Stock Medicines */}
        <Link href="/pharmacy/medicines?status=low_stock">
          <StatCard
            title="Low-Stock Alerts"
            value={stats.lowStockMedicinesCount}
            subtext="Below reorder threshold"
            icon={
              <div className="text-rose-600">
                <MedicinesIcon className="w-4 h-4" />
              </div>
            }
          />
        </Link>

        {/* Today's Dispensing */}
        <Link href="/pharmacy/history?range=today">
          <StatCard
            title="Today's Dispensing"
            value={stats.todayDispensingCount}
            subtext="Completed & in-progress"
            icon={
              <div className="text-teal-600">
                <DispensingIcon className="w-4 h-4" />
              </div>
            }
          />
        </Link>
      </div>

      {/* TWO COLUMN GRID: Pending Prescriptions & Ready for Dispensing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Pending Prescriptions */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">Pending Prescriptions</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                {pendingPrescriptions.length}
              </span>
            </div>
            <Link
              href="/pharmacy/prescriptions"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              View All →
            </Link>
          </div>

          {pendingPrescriptions.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No pending prescriptions awaiting review.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingPrescriptions.map((rx: any) => (
                <Link
                  key={rx._id}
                  href={`/pharmacy/prescriptions/${rx._id}`}
                  className="block p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 hover:border-teal-500/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {rx.patientId?.name || "Patient"}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono">
                          {rx.patientId?.mrn || "MRN"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dr. {rx.doctorId?.name || "Doctor"} • {rx.doctorId?.specialty || "General"}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Pending Review
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {rx.medications?.slice(0, 3).map((m: any, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium"
                      >
                        {m.medicine} ({m.dosage})
                      </span>
                    ))}
                    {rx.medications?.length > 3 && (
                      <span className="text-[11px] text-slate-500">
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900">Ready for Dispensing</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                {readyPrescriptions.length}
              </span>
            </div>
            <Link
              href="/pharmacy/prescriptions?status=ready"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              View All →
            </Link>
          </div>

          {readyPrescriptions.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No prescriptions currently ready for dispensing.
            </div>
          ) : (
            <div className="space-y-3">
              {readyPrescriptions.map((rx: any) => (
                <Link
                  key={rx._id}
                  href={`/pharmacy/prescriptions/${rx._id}`}
                  className="block p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 hover:border-emerald-500/40 transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {rx.patientId?.name || "Patient"}
                        </span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono">
                          {rx.patientId?.mrn || "MRN"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dr. {rx.doctorId?.name || "Doctor"} • {new Date(rx.date || rx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Ready to Dispense
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {rx.medications?.length} prescribed medication{rx.medications?.length > 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold text-emerald-600 group-hover:underline">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Low-Stock Medicines */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h2 className="text-sm font-bold text-slate-900">Low-Stock Alert Registry</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                {lowStockMedicines.length} items
              </span>
            </div>
            <Link
              href="/pharmacy/medicines"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Inventory Catalog →
            </Link>
          </div>

          {lowStockMedicines.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              All inventory levels are currently above reorder thresholds.
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockMedicines.map((med: any) => (
                <Link
                  key={med._id}
                  href={`/pharmacy/medicines/${med._id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-900">{med.name}</span>
                    <span className="text-xs text-slate-500">
                      {med.category} • Location: {med.location || "Shelf"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${med.availableQuantity === 0 ? "text-rose-600" : "text-amber-600"}`}>
                        {med.availableQuantity} {med.unit}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Min: {med.lowStockThreshold} {med.unit}
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        med.status === "out_of_stock"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <h2 className="text-sm font-bold text-slate-900">Recent Activity & Audit</h2>
            </div>
            <Link
              href="/pharmacy/history"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              Full History →
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No recent dispensing activity recorded.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((act: any) => (
                <div key={act.id} className="py-2.5 flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      act.type === "dispense"
                        ? "bg-teal-50 text-teal-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {act.type === "dispense" ? (
                      <DispensingIcon className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangleIcon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900">{act.title}</p>
                    <p className="text-xs text-slate-500 truncate">{act.description}</p>
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
