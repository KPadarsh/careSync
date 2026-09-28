"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MedicinesIcon,
  SearchIcon,
  FilterIcon,
  PlusIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshIcon,
} from "./PharmacyIcons";

export function MedicinesView() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // New Medicine Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    genericName: "",
    category: "Antibiotics",
    availableQuantity: 100,
    unit: "tablets",
    lowStockThreshold: 25,
    unitPrice: 10.0,
    location: "Shelf A-01",
    description: "",
  });

  const fetchMedicines = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/pharmacy/medicines", window.location.origin);
      if (statusFilter !== "all") url.searchParams.set("status", statusFilter);
      if (categoryFilter !== "all") url.searchParams.set("category", categoryFilter);
      if (searchQuery.trim()) url.searchParams.set("search", searchQuery.trim());

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load medicines inventory");
      const data = await res.json();
      setMedicines(data.medicines || []);
      if (data.counts) setCounts(data.counts);
      if (data.categories) setCategories(data.categories);
    } catch (err: any) {
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedicines();
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/pharmacy/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add medicine");

      setShowAddModal(false);
      setNewMed({
        name: "",
        genericName: "",
        category: "Antibiotics",
        availableQuantity: 100,
        unit: "tablets",
        lowStockThreshold: 25,
        unitPrice: 10.0,
        location: "Shelf A-01",
        description: "",
      });
      await fetchMedicines();
    } catch (err: any) {
      alert(err.message || "Failed to add medicine");
    } finally {
      setAddLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_stock":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            In Stock
          </span>
        );
      case "low_stock":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Low Stock
          </span>
        );
      case "out_of_stock":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Out of Stock
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
              DISPENSARY INVENTORY (V1)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Medicines & Formulary Catalog
          </h1>
          <p className="text-sm text-slate-400">
            Monitor stock counts, track low-stock thresholds, and manage dispensary catalog.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg shadow-teal-950/40 transition-all hover:scale-102"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Metric summary chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "all"
              ? "bg-[#0E1F3D] border-teal-500/50"
              : "bg-[#0A1324] border-slate-800/80 hover:bg-slate-900"
          }`}
        >
          <span className="text-xs text-slate-400 font-medium">Total Catalog</span>
          <div className="text-2xl font-extrabold text-white mt-1">{counts.total}</div>
        </button>

        <button
          onClick={() => setStatusFilter("in_stock")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "in_stock"
              ? "bg-[#0E1F3D] border-emerald-500/50"
              : "bg-[#0A1324] border-slate-800/80 hover:bg-slate-900"
          }`}
        >
          <span className="text-xs text-emerald-400 font-medium">In Stock</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{counts.inStock}</div>
        </button>

        <button
          onClick={() => setStatusFilter("low_stock")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "low_stock"
              ? "bg-[#0E1F3D] border-amber-500/50"
              : "bg-[#0A1324] border-slate-800/80 hover:bg-slate-900"
          }`}
        >
          <span className="text-xs text-amber-400 font-medium">Low Stock</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{counts.lowStock}</div>
        </button>

        <button
          onClick={() => setStatusFilter("out_of_stock")}
          className={`p-4 rounded-xl border text-left transition-all ${
            statusFilter === "out_of_stock"
              ? "bg-[#0E1F3D] border-rose-500/50"
              : "bg-[#0A1324] border-slate-800/80 hover:bg-slate-900"
          }`}
        >
          <span className="text-xs text-rose-400 font-medium">Out of Stock</span>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{counts.outOfStock}</div>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-[#0A1324] border border-slate-800/80 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs text-slate-400 font-medium shrink-0">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-72">
          <div className="relative flex-1">
            <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine name, rack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            <SearchIcon className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Medicines Table */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
            Loading medicines catalog...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No medicines found matching the filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#08101E] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Medicine Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Dispensary Stock</th>
                  <th className="px-5 py-3.5">Unit</th>
                  <th className="px-5 py-3.5">Low-Stock Threshold</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {medicines.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-900/40 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm group-hover:text-teal-300 transition-colors">
                        {m.name}
                      </div>
                      {m.genericName && (
                        <div className="text-[11px] text-slate-400 italic">
                          {m.genericName}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 font-medium">
                        {m.category}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-base">
                      <span
                        className={
                          m.availableQuantity === 0
                            ? "text-rose-400"
                            : m.availableQuantity <= m.lowStockThreshold
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }
                      >
                        {m.availableQuantity}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-300 font-medium capitalize">
                      {m.unit}
                    </td>

                    <td className="px-5 py-4 text-slate-400 font-mono">
                      {m.lowStockThreshold} {m.unit}
                    </td>

                    <td className="px-5 py-4 text-slate-300 font-mono text-[11px]">
                      {m.location || "Shelf A"}
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(m.status)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/pharmacy/medicines/${m._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-white font-semibold text-xs transition-colors"
                      >
                        <span>Manage</span>
                        <span>→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD MEDICINE MODAL (V1 INVENTORY ONLY) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1324] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <MedicinesIcon className="w-5 h-5" />
                <span>Add Medicine to Dispensary Inventory</span>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Medicine Name (Brand / Strength) <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin 500mg"
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin Trihydrate"
                    value={newMed.genericName}
                    onChange={(e) => setNewMed({ ...newMed, genericName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Antibiotics"
                    value={newMed.category}
                    onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Available Quantity <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMed.availableQuantity}
                    onChange={(e) => setNewMed({ ...newMed, availableQuantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unit</label>
                  <select
                    value={newMed.unit}
                    onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="tablets">tablets</option>
                    <option value="capsules">capsules</option>
                    <option value="inhalers">inhalers</option>
                    <option value="vials">vials</option>
                    <option value="bottles">bottles</option>
                    <option value="tubes">tubes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Low-Stock Threshold <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newMed.lowStockThreshold}
                    onChange={(e) => setNewMed({ ...newMed, lowStockThreshold: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Dispensary Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Shelf A-02"
                    value={newMed.location}
                    onChange={(e) => setNewMed({ ...newMed, location: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  {addLoading ? "Saving..." : "Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
