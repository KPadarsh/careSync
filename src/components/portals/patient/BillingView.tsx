"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface InvoiceItem {
  id: string;
  invoiceDbId?: string;
  service: string;
  provider: string;
  date: string;
  totalBilled: string;
  insuranceCovered: string;
  patientOwing: string;
  status: "Unpaid" | "Paid" | "Pending Insurance";
  balanceAmountNum?: number;
}

export function BillingView() {
  const [activeFilter, setActiveFilter] = useState<"all" | "unpaid" | "paid">("all");
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);
  const [insuranceInfo, setInsuranceInfo] = useState<{ provider?: string; policyNumber?: string }>({});
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payingAll, setPayingAll] = useState(false);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/patient/billing");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        setTotalOutstanding(data.totalOutstanding || 0);
        if (data.insurance) {
          setInsuranceInfo(data.insurance);
        }
      }
    } catch (err) {
      console.error("Failed to load billing:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, []);

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      setPayingId(invoiceId);
      const res = await fetch("/api/patient/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      if (res.ok) {
        await fetchBilling();
      } else {
        const err = await res.json();
        alert(err.error || "Payment failed");
      }
    } catch (e) {
      console.error("Payment error:", e);
    } finally {
      setPayingId(null);
    }
  };

  const handlePayFullBalance = async () => {
    try {
      setPayingAll(true);
      const res = await fetch("/api/patient/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payFullBalance: true }),
      });
      if (res.ok) {
        await fetchBilling();
      } else {
        const err = await res.json();
        alert(err.error || "Payment failed");
      }
    } catch (e) {
      console.error("Pay all error:", e);
    } finally {
      setPayingAll(false);
    }
  };

  const unpaidCount = invoices.filter((i) => i.status === "Unpaid").length;
  const paidCount = invoices.filter((i) => i.status === "Paid").length;

  const filtered = invoices.filter((inv) => {
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
          <div className="text-display font-extrabold text-foreground mt-1">
            ${totalOutstanding.toFixed(2)}
          </div>
          <p className="text-small text-muted-foreground mt-1">
            Due across {unpaidCount} statement invoice{unpaidCount === 1 ? "" : "s"}. Primary Insurance:{" "}
            {insuranceInfo.provider || "Standard Outpatient"} {insuranceInfo.policyNumber ? `(${insuranceInfo.policyNumber})` : ""}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {totalOutstanding > 0 && (
            <Button
              variant="primary"
              size="lg"
              className="gap-2"
              onClick={handlePayFullBalance}
              disabled={payingAll}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {payingAll ? "Processing..." : `Pay Full Balance ($${totalOutstanding.toFixed(2)})`}
            </Button>
          )}
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
              {tab === "all"
                ? `All Invoices (${invoices.length})`
                : tab === "unpaid"
                ? `Unpaid (${unpaidCount})`
                : `Settled (${paidCount})`}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-small">Loading statements...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-small">No statements found.</div>
          ) : (
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
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={payingId === inv.id}
                          onClick={() => handlePayInvoice(inv.id)}
                        >
                          {payingId === inv.id ? "Paying..." : "Pay"}
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
          )}
        </div>
      </Card>
    </div>
  );
}
