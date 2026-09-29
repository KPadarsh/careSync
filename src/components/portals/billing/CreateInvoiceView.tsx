"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "./BillingIcons";

const PRESET_SERVICES = [
  { name: "Specialist Physician Consultation", category: "consultation", price: 180 },
  { name: "General Practice Routine Consultation", category: "consultation", price: 120 },
  { name: "Comprehensive Metabolic Panel (CMP 14)", category: "laboratory", price: 140 },
  { name: "Complete Blood Count (CBC w/ Diff)", category: "laboratory", price: 65 },
  { name: "12-Lead Resting Electrocardiogram (ECG)", category: "procedure", price: 75 },
  { name: "Chest Radiography (X-Ray 2-Views)", category: "radiology", price: 160 },
  { name: "Dispensary Antibiotic Prescription Fulfillment", category: "pharmacy", price: 45 },
  { name: "Dispensary Chronic Disease Refill (30-day)", category: "pharmacy", price: 60 },
  { name: "Outpatient Clinical Dressing & Nursing Care", category: "nursing", price: 50 },
  { name: "Minor Surgical Lesion Biopsy / Excision", category: "procedure", price: 210 },
];

export function CreateInvoiceView() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [services, setServices] = useState<
    Array<{ serviceName: string; category: string; quantity: number; unitPrice: number; notes: string }>
  >([
    {
      serviceName: "Specialist Physician Consultation",
      category: "consultation",
      quantity: 1,
      unitPrice: 180,
      notes: "Standard outpatient evaluation",
    },
  ]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [patRes, docRes] = await Promise.all([
          fetch("/api/patient/profile").catch(() => null),
          fetch("/api/doctor/profile").catch(() => null),
        ]);

        // Fetch patients list from reception or general API
        const pRes = await fetch("/api/reception/patients");
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.patients) {
            setPatients(pData.patients);
            if (pData.patients.length > 0) {
              setSelectedPatientId(pData.patients[0]._id);
            }
          }
        }

        const dRes = await fetch("/api/reception/doctors");
        if (dRes.ok) {
          const dData = await dRes.json();
          if (dData.doctors) {
            setDoctors(dData.doctors);
            if (dData.doctors.length > 0) {
              setSelectedDoctorId(dData.doctors[0]._id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load initial billing form data:", err);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  const handleAddServiceLine = () => {
    setServices([
      ...services,
      {
        serviceName: "General Practice Routine Consultation",
        category: "consultation",
        quantity: 1,
        unitPrice: 120,
        notes: "",
      },
    ]);
  };

  const handleRemoveServiceLine = (index: number) => {
    if (services.length <= 1) return;
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    const updated = [...services];
    (updated[index] as any)[field] = value;
    setServices(updated);
  };

  const handleSelectPreset = (index: number, presetName: string) => {
    const match = PRESET_SERVICES.find((p) => p.name === presetName);
    if (!match) return;
    const updated = [...services];
    updated[index] = {
      ...updated[index],
      serviceName: match.name,
      category: match.category,
      unitPrice: match.price,
    };
    setServices(updated);
  };

  const subtotal = services.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 1) * (Number(curr.unitPrice) || 0),
    0
  );
  const total = Math.max(0, subtotal - (Number(discountAmount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedPatientId) {
      setErrorMsg("Please select a patient.");
      return;
    }

    if (services.length === 0) {
      setErrorMsg("At least one billable service line is required.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/billing/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          doctorId: selectedDoctorId || undefined,
          dueDate,
          services,
          discountAmount: Number(discountAmount) || 0,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");

      router.push(`/billing/invoices/${data.invoice._id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/billing/invoices"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Invoices</span>
        </Link>

        <span className="text-xs text-blue-400 font-semibold">
          New Patient Accounts Statement
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Create Patient Invoice
        </h1>
        <p className="text-sm text-slate-400">
          Bill professional consultations, procedures, lab panels, and pharmacy prescriptions.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient and Physician Assignment */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Patient & Clinical Referral Reference
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Select Patient <span className="text-blue-400">*</span>
              </label>
              <select
                required
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.mrn} • {p.bloodGroup || "No blood type"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Attending / Referring Physician
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">None / General Billing</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    Dr. {d.name} ({d.specialty || d.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Payment Due Date <span className="text-blue-400">*</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Billable Services Itemization */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Billable Clinical Services & Formulary
            </h2>
            <button
              type="button"
              onClick={handleAddServiceLine}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="space-y-3">
            {services.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-slate-400 text-[11px] font-medium">Quick Template:</span>
                    <select
                      onChange={(e) => handleSelectPreset(idx, e.target.value)}
                      className="p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] focus:outline-none"
                    >
                      <option value="">Choose standard clinical service...</option>
                      {PRESET_SERVICES.map((preset, pIdx) => (
                        <option key={pIdx} value={preset.name}>
                          {preset.name} (${preset.price.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveServiceLine(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-slate-400 font-medium mb-1">
                      Service Description <span className="text-blue-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Service title..."
                      value={item.serviceName}
                      onChange={(e) => handleServiceChange(idx, "serviceName", e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-slate-400 font-medium mb-1">Category</label>
                    <select
                      value={item.category}
                      onChange={(e) => handleServiceChange(idx, "category", e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="consultation">Consultation</option>
                      <option value="laboratory">Laboratory</option>
                      <option value="pharmacy">Pharmacy</option>
                      <option value="radiology">Radiology</option>
                      <option value="nursing">Nursing</option>
                      <option value="procedure">Procedure</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-slate-400 font-medium mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) =>
                        handleServiceChange(idx, "quantity", Math.max(1, Number(e.target.value)))
                      }
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-slate-400 font-medium mb-1">Unit Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleServiceChange(idx, "unitPrice", Math.max(0, Number(e.target.value)))
                      }
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
                  <input
                    type="text"
                    placeholder="Optional item notes (e.g. CPT code, batch reference)..."
                    value={item.notes}
                    onChange={(e) => handleServiceChange(idx, "notes", e.target.value)}
                    className="flex-1 mr-4 bg-transparent border-none text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none"
                  />
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 mr-2">Line Subtotal:</span>
                    <span className="font-mono font-bold text-white text-xs">
                      ${((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Adjustments Card */}
        <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Billing Statement Notes / Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add payment terms, copay reconciliation notes, or insurance claim numbers..."
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-3 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-slate-300">
                <span>Services Subtotal:</span>
                <span className="font-mono font-bold text-white">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <label className="text-slate-300">Courtesy / Insurance Discount ($):</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                  className="w-24 p-1.5 rounded-lg bg-slate-950 border border-slate-700 text-right font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Total Amount Due:
                </span>
                <span className="font-mono text-xl font-extrabold text-blue-400">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Link
              href="/billing/invoices"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/40 transition-all hover:scale-102"
            >
              {submitting ? "Issuing Invoice..." : "Issue Patient Invoice"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
