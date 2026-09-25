"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface LabReportItem {
  id: string;
  testName: string;
  department: string;
  date: string;
  orderingDoctor: string;
  status: "Normal" | "Elevated" | "Pending";
  keyFindings: string;
}

const mockLabs: LabReportItem[] = [
  {
    id: "LAB-7104",
    testName: "Complete Blood Count with Differential (CBC)",
    department: "Hematology & Blood Banking",
    date: "Sep 22, 2026",
    orderingDoctor: "Dr. Anjali Menon",
    status: "Normal",
    keyFindings: "Hemoglobin 14.2 g/dL (normal: 13.5-17.5). White Blood Cells 6.4 x10^3/uL. Platelets normal.",
  },
  {
    id: "LAB-6981",
    testName: "Comprehensive Metabolic Panel (CMP)",
    department: "Clinical Biochemistry",
    date: "Aug 15, 2026",
    orderingDoctor: "Dr. Sarah Jenkins",
    status: "Normal",
    keyFindings: "Electrolytes balanced. Fasting Glucose: 94 mg/dL. Kidney & liver enzyme markers within expected limits.",
  },
  {
    id: "LAB-6720",
    testName: "Standard Lipid Profile Panel",
    department: "Clinical Biochemistry",
    date: "Jun 20, 2026",
    orderingDoctor: "Dr. Michael Chen",
    status: "Elevated",
    keyFindings: "Total Cholesterol: 215 mg/dL (flagged slightly high). HDL: 48 mg/dL. LDL: 138 mg/dL.",
  },
  {
    id: "LAB-7299",
    testName: "Thyroid Stimulating Hormone (TSH) Reflex",
    department: "Endocrine Pathology",
    date: "Sep 24, 2026",
    orderingDoctor: "Dr. Anjali Menon",
    status: "Pending",
    keyFindings: "Specimen collected and under laboratory analysis. Results expected within 24 hours.",
  },
];

export function LabReportsView() {
  const [filter, setFilter] = useState("all");

  const filtered = mockLabs.filter((item) => {
    if (filter === "all") return true;
    return item.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-h2 font-bold text-foreground tracking-tight">Test Results &amp; Lab Reports</h2>
          <p className="text-body text-muted-foreground mt-1">
            Access verified pathology specimens, blood work analyses, and diagnostic data.
          </p>
        </div>

        <Button variant="outline" size="md" className="gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download All Lab PDFs
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        {(["all", "Normal", "Elevated", "Pending"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`px-3.5 py-1.5 rounded-md text-caption font-semibold transition-colors cursor-pointer ${
              filter === status
                ? "bg-primary text-primary-foreground"
                : "bg-surface text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            {status === "all" ? "All Tests" : status}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filtered.map((item) => (
          <Card key={item.id} className="p-5 border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-3">
                <span className="text-caption font-mono font-semibold text-muted-foreground">{item.id}</span>
                <Badge variant={item.status === "Normal" ? "success" : item.status === "Elevated" ? "warning" : "info"}>
                  {item.status}
                </Badge>
                <span className="text-caption text-muted-foreground">{item.date}</span>
              </div>

              <h4 className="text-h4 font-bold text-foreground">{item.testName}</h4>
              <p className="text-caption text-muted-foreground">
                Lab Division: <span className="text-foreground font-medium">{item.department}</span> • Ordered by: <span className="text-foreground font-medium">{item.orderingDoctor}</span>
              </p>
              <p className="text-small text-foreground/80 bg-surface-muted/60 p-2.5 rounded border border-border/40">
                {item.keyFindings}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={item.status === "Pending" ? "outline" : "primary"}
                size="sm"
                disabled={item.status === "Pending"}
                className="gap-1.5"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {item.status === "Pending" ? "Awaiting Report" : "View Report"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
