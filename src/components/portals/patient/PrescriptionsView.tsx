"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface PrescriptionItem {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  prescribedBy: string;
  datePrescribed: string;
  refillsRemaining: number;
  status: "Active" | "Refill Needed" | "Completed";
  instructions: string;
}

const mockPrescriptions: PrescriptionItem[] = [
  {
    id: "RX-4091",
    medication: "Atorvastatin Calcium",
    dosage: "20 mg Oral Tablet",
    frequency: "Once daily at bedtime",
    prescribedBy: "Dr. Sarah Jenkins (Cardiology)",
    datePrescribed: "Aug 15, 2026",
    refillsRemaining: 2,
    status: "Active",
    instructions: "Take with or without food. Avoid grapefruit consumption during medication period.",
  },
  {
    id: "RX-3882",
    medication: "Amoxicillin Trihydrate",
    dosage: "500 mg Capsule",
    frequency: "Three times daily for 7 days",
    prescribedBy: "Dr. Michael Chen (Primary Care)",
    datePrescribed: "Jul 10, 2026",
    refillsRemaining: 0,
    status: "Completed",
    instructions: "Complete the full 7-day course even if clinical symptoms improve early.",
  },
  {
    id: "RX-3510",
    medication: "Lisinopril",
    dosage: "10 mg Oral Tablet",
    frequency: "Once daily in the morning",
    prescribedBy: "Dr. Anjali Menon (General Medicine)",
    datePrescribed: "May 02, 2026",
    refillsRemaining: 0,
    status: "Refill Needed",
    instructions: "Monitor blood pressure weekly. Report any persistent dry cough to provider.",
  },
];

export function PrescriptionsView() {
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = mockPrescriptions.filter((item) => {
    if (filterStatus === "all") return true;
    return item.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-h2 font-bold text-foreground tracking-tight">Prescriptions</h2>
          <p className="text-body text-muted-foreground mt-1">
            Active medication schedules, dosage guidelines, and pharmacy refill requests.
          </p>
        </div>

        <Button variant="primary" size="md" className="gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Request Pharmacy Refill
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {(["all", "Active", "Refill Needed", "Completed"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilterStatus(status)}
            className={`px-3.5 py-1.5 rounded-md text-caption font-semibold transition-colors cursor-pointer ${
              filterStatus === status
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {status === "all" ? "All Medications" : status}
          </button>
        ))}
      </div>

      {/* Prescriptions Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((item) => (
          <Card key={item.id} className="p-5 border border-border shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-caption font-mono text-muted-foreground">{item.id}</span>
                  <h4 className="text-h4 font-bold text-foreground">{item.medication}</h4>
                  <p className="text-small font-medium text-primary">{item.dosage}</p>
                </div>

                <Badge
                  variant={
                    item.status === "Active"
                      ? "success"
                      : item.status === "Refill Needed"
                      ? "warning"
                      : "neutral"
                  }
                >
                  {item.status}
                </Badge>
              </div>

              <div className="rounded-md bg-surface-muted p-3 text-caption text-foreground/90 space-y-1">
                <p>
                  <span className="font-semibold text-muted-foreground">Frequency:</span> {item.frequency}
                </p>
                <p>
                  <span className="font-semibold text-muted-foreground">Instructions:</span> {item.instructions}
                </p>
              </div>

              <div className="text-caption text-muted-foreground space-y-0.5">
                <p>Prescribed by: <span className="font-medium text-foreground">{item.prescribedBy}</span></p>
                <p>Date: {item.datePrescribed} • Refills Remaining: <span className="font-bold text-foreground">{item.refillsRemaining}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
              <Button
                variant={item.refillsRemaining > 0 ? "primary" : "outline"}
                size="sm"
                className="flex-1"
                disabled={item.status === "Completed"}
              >
                {item.refillsRemaining > 0 ? "Request Refill" : "Renew Rx"}
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View Pharmacy
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
