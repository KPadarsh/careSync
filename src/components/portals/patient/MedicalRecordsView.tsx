"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface MedicalRecordItem {
  id: string;
  title: string;
  doctor: string;
  department: string;
  date: string;
  category: "Consultation" | "Diagnostic" | "Vaccination" | "Discharge";
  summary: string;
}

const mockRecords: MedicalRecordItem[] = [
  {
    id: "MR-9821",
    title: "Annual Cardiovascular Health Assessment",
    doctor: "Dr. Sarah Jenkins",
    department: "Cardiology Center",
    date: "Aug 15, 2026",
    category: "Consultation",
    summary: "Routine cardiovascular checkup. Blood pressure optimal (118/76). ECG indicates normal sinus rhythm.",
  },
  {
    id: "MR-9742",
    title: "Comprehensive Metabolic Panel Review",
    doctor: "Dr. Michael Chen",
    department: "Internal Medicine",
    date: "Jun 20, 2026",
    category: "Diagnostic",
    summary: "Fasting lipid panel and liver enzyme evaluation. Slight elevation in LDL cholesterol; dietary modifications advised.",
  },
  {
    id: "MR-9510",
    title: "Seasonal Influenza & Booster Immunization",
    doctor: "Nurse Sarah Davis",
    department: "Immunization Clinic",
    date: "Nov 04, 2025",
    category: "Vaccination",
    summary: "Administered Quadrivalent standard dose. Zero immediate adverse allergic reactions observed.",
  },
];

export function MedicalRecordsView() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockRecords.filter((rec) => {
    if (selectedCategory !== "all" && rec.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (
      searchQuery &&
      !rec.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !rec.doctor.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !rec.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-h2 font-bold text-foreground tracking-tight">Medical Records</h2>
          <p className="text-body text-muted-foreground mt-1">
            Access and download your official clinical diagnoses and consultation history.
          </p>
        </div>

        <Button variant="outline" size="md" className="gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export All Records
        </Button>
      </div>

      <Card className="overflow-hidden border border-border shadow-sm">
        {/* Search & Category Filter Bar */}
        <div className="p-4 bg-surface border-b border-border flex flex-wrap gap-3 items-center">
          <div className="relative min-w-[240px] flex-1 sm:flex-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, doctor, ID..."
              className="w-full bg-surface-muted/50 border border-border rounded-md pl-9 pr-3 py-2 text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            {(["all", "Consultation", "Diagnostic", "Vaccination"] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-caption font-semibold transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "all" ? "All Records" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Records Listing */}
        <div className="divide-y divide-border">
          {filtered.map((record) => (
            <div key={record.id} className="p-5 hover:bg-surface-muted/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-caption font-mono font-semibold text-muted-foreground">{record.id}</span>
                  <Badge variant={record.category === "Consultation" ? "info" : record.category === "Diagnostic" ? "warning" : "success"}>
                    {record.category}
                  </Badge>
                  <span className="text-caption text-muted-foreground">{record.date}</span>
                </div>
                <h4 className="text-h4 font-bold text-foreground">{record.title}</h4>
                <p className="text-caption text-muted-foreground">
                  Provider: <span className="font-medium text-foreground">{record.doctor}</span> ({record.department})
                </p>
                <p className="text-small text-foreground/80">{record.summary}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </Button>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  PDF
                </Button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-12 text-center text-small text-muted-foreground">
              No medical records match your criteria.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
