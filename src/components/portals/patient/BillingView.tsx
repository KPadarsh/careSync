"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface InvoiceItem {
  id: string;
  service: string;
  provider: string;
  date: string;
  totalBilled: string;
  insuranceCovered: string;
  patientOwing: string;
  status: "Unpaid" | "Paid" | "Pending Insurance";
}

const mockInvoices: InvoiceItem[] = [
  {
    id: "INV-2026-081",
    service: "Comprehensive Cardiology Assessment & Resting ECG",
    provider: "Dr. Sarah Jenkins",
    date: "Aug 15, 2026",
    totalBilled: "$450.00",
    insuranceCovered: "$350.00",
    patientOwing: "$100.00",
    status: "Unpaid",
  },
  {
    id: "INV-2026-074",
    service: "Outpatient General Consultation & Prescription",
    provider: "Dr. Anjali Menon",
    date: "Aug 02, 2026",
    totalBilled: "$200.00",
    insuranceCovered: "$150.00",
    patientOwing: "$50.00",
    status: "Unpaid",
  },
  {
    id: "INV-2026-060",
    service: "Comprehensive Metabolic Panel & Lipid Bloodwork",
    provider: "Central Diagnostics Laboratory",
    date: "Jun 20, 2026",
    totalBilled: "$320.00",
    insuranceCovered: "$320.00",
    patientOwing: "$0.00",
    status: "Paid",
  },
  {
    id: "INV-2026-092",
    service: "Specialist Dermatology Evaluation",
    provider: "Dr. Emily Rivera",
    date: "Sep 20, 2026",
    totalBilled: "$1,100.00",
    insuranceCovered: "$0.00",
    patientOwing: "$1,100.00",
    status: "Unpaid",
  },
];

export function BillingView() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filtered = mockInvoices.filter((inv) => {
    if (activeFilter === "all") return true;
    return inv.status.toLowerCase().replace(" ", "_") === activeFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-h2 font-bold text-foreground tracking-tight">Bills &amp; Payments</h2>
          <p className="text-body text-muted-foreground mt-1">
            Review detailed medical billing statements, insurance coverage, and settle outstanding balances.
          </p>
        </div>
      </div>

      {/* Outstanding Balance Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-caption font-bold text-primary tracking-wider uppercase">
            Total Outstanding Balance
          </span>
          <div className="text-display font-extrabold text-foreground mt-1">$1,250.00</div>
          <p className="text-small text-muted-foreground mt-1">
            Due across 3 statement invoices. Primary Insurance: BlueCross BlueShield (Active).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="primary" size="lg" className="gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pay Full Balance ($1,250)
          </Button>
        </div>
      </div>

      {/* Statements Table */}
      <Card className="overflow-hidden border border-border shadow-sm">
        <div className="border-b border-border px-4 py-3 flex items-center gap-2 bg-surface-muted/30">
          {(["all", "unpaid", "paid"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveFilter(tab)}
              className={`px-3.5 py-1.5 rounded-md text-caption font-semibold transition-colors cursor-pointer ${
                activeFilter === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {tab === "all" ? "All Invoices" : tab === "unpaid" ? "Unpaid (3)" : "Settled (1)"}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-muted/40 text-muted-foreground text-caption font-bold uppercase tracking-wider border-b border-border">
                <th className="py-3 px-4 w-28">Invoice ID</th>
                <th className="py-3 px-4">Service &amp; Provider</th>
                <th className="py-3 px-4 w-32">Date</th>
                <th className="py-3 px-4 w-28">Billed</th>
                <th className="py-3 px-4 w-28">Insurance</th>
                <th className="py-3 px-4 w-32">Your Responsibility</th>
                <th className="py-3 px-4 w-28">Status</th>
                <th className="py-3 px-4 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="py-3.5 px-4 text-caption font-mono font-medium text-muted-foreground">
                    {inv.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-small font-semibold text-foreground">{inv.service}</div>
                    <div className="text-caption text-muted-foreground">{inv.provider}</div>
                  </td>
                  <td className="py-3.5 px-4 text-small text-muted-foreground">
                    {inv.date}
                  </td>
                  <td className="py-3.5 px-4 text-small text-muted-foreground">
                    {inv.totalBilled}
                  </td>
                  <td className="py-3.5 px-4 text-small text-success font-medium">
                    {inv.insuranceCovered}
                  </td>
                  <td className="py-3.5 px-4 text-small font-bold text-foreground">
                    {inv.patientOwing}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant={inv.status === "Paid" ? "success" : "error"}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.status === "Unpaid" ? (
                      <Button variant="primary" size="sm">
                        Pay
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        Receipt
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
