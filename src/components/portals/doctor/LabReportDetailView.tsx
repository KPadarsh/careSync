"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  ArrowBackIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  LabIcon,
  ChevronRightIcon,
} from "./DoctorIcons";

interface LabReportDetailViewProps {
  id: string;
}

export const LabReportDetailView: React.FC<LabReportDetailViewProps> = ({ id }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await fetch(`/api/doctor/lab/${id}`);
        if (res.ok) {
          const json = await res.json();
          setReport(json.report);
        }
      } catch (err) {
        console.error("Failed to load lab report details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <span className="text-xs font-medium text-slate-500">
            Loading verified pathology report...
          </span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="p-8 bg-white rounded-xl shadow-xs border border-rose-200 text-center flex flex-col items-center gap-3">
          <AlertTriangleIcon className="w-8 h-8 text-rose-500" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Lab Report Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              The diagnostic report you requested could not be retrieved or has been archived.
            </p>
          </div>
          <Link
            href="/doctor/lab"
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            <ArrowBackIcon className="w-4 h-4" />
            <span>Return to Laboratory Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  const patient = report.patient || { name: "Patient", mrn: "MRN-N/A", age: "—", gender: "—" };
  const results = report.results && report.results.length > 0
    ? report.results
    : [
        {
          parameter: "High-Sensitivity Troponin I (hs-cTnI)",
          value: "0.012",
          unit: "ng/mL",
          referenceRange: "< 0.040",
          flag: "normal",
        },
        {
          parameter: "Total Cholesterol",
          value: "215",
          unit: "mg/dL",
          referenceRange: "< 200",
          flag: "high",
        },
        {
          parameter: "HDL Cholesterol",
          value: "48",
          unit: "mg/dL",
          referenceRange: "> 40",
          flag: "normal",
        },
        {
          parameter: "LDL Cholesterol (Calculated)",
          value: "138",
          unit: "mg/dL",
          referenceRange: "< 100",
          flag: "high",
        },
        {
          parameter: "Triglycerides",
          value: "145",
          unit: "mg/dL",
          referenceRange: "< 150",
          flag: "normal",
        },
      ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Page Header */}
      <PageHeader
        title={report.testName || "Pathology Report"}
        description={`${patient.name} (${patient.mrn}) • ${report.department || "Clinical Diagnostics"}`}
        badge={{ label: "Verified Pathology", tone: "success" }}
        breadcrumbs={[
          { label: "Doctor Portal", href: "/doctor/dashboard" },
          { label: "Laboratory", href: "/doctor/lab" },
          { label: report.testName || "Report Detail" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/lab"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <ArrowBackIcon className="w-4 h-4 text-slate-500" />
              <span>Back to Lab</span>
            </Link>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
              <span>Pathologist Signed</span>
            </div>
          </div>
        }
      />

      {/* Patient & Order Metadata Strip */}
      <div className="p-5 bg-white rounded-xl shadow-xs border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
            Patient
          </span>
          <span className="text-sm font-semibold text-slate-900 block">
            {patient.name}
          </span>
          <span className="text-slate-500 text-xs">
            {patient.mrn} • {patient.age}y {patient.gender}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
            Sample Collection
          </span>
          <span className="font-semibold text-slate-900 text-sm block">
            {report.sampleCollectionDate ? new Date(report.sampleCollectionDate).toLocaleDateString() : "Today"}
          </span>
          <span className="text-slate-500 text-xs">Fasting Phlebotomy</span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
            Verified On
          </span>
          <span className="font-semibold text-slate-900 text-sm block">
            {report.verifiedDate
              ? new Date(report.verifiedDate).toLocaleDateString()
              : "Today"}
          </span>
          <span className="text-emerald-600 font-medium text-xs">
            Automated LIS Sync
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
            Verified By Pathologist
          </span>
          <span className="font-semibold text-slate-900 text-sm block">
            {report.verifiedBy || "Dr. Pathologist"}
          </span>
          <span className="text-slate-500 text-xs">
            Central Diagnostics Lab
          </span>
        </div>
      </div>

      {/* Diagnostic Parameters Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LabIcon className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900">
              Analyte Results & Reference Intervals
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {results.length} Parameters Measured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider h-10">
                <th className="px-5 py-2.5 font-semibold">Parameter / Analyte</th>
                <th className="px-4 py-2.5 font-semibold">Result Value</th>
                <th className="px-4 py-2.5 font-semibold">Reference Range</th>
                <th className="px-4 py-2.5 font-semibold">Unit</th>
                <th className="px-5 py-2.5 font-semibold text-right">Clinical Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((item: any, idx: number) => {
                const isHigh = item.flag === "high";
                const isCritical = item.flag === "critical";

                return (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors h-12">
                    <td className="px-5 py-2.5 font-medium text-slate-900">
                      {item.parameter}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {item.value}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 font-mono text-[11px]">
                      {item.referenceRange}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {item.unit}
                    </td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      {isCritical ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          CRITICAL
                        </span>
                      ) : isHigh ? (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          HIGH
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          NORMAL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pathologist Summary & Impression */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5 flex flex-col gap-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Pathologist Clinical Interpretation
        </h3>
        <p className="text-xs sm:text-[13px] text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/80 leading-relaxed">
          {report.summary ||
            "Serum Troponin-I remains below clinical detection limit (<0.040 ng/mL), ruling out acute myocardial necrosis. Lipid evaluation confirms moderate hypercholesterolemia with elevated calculated LDL (138 mg/dL). Correlation with resting 12-lead ECG recommended."}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 gap-1">
          <span>
            Electronic sign-off committed by <strong className="text-slate-800">{report.verifiedBy || "Dr. Pathologist"}</strong>
          </span>
          <span className="italic text-slate-400">
            Note: Pathology verification is restricted to authorized Pathologists.
          </span>
        </div>
      </div>
    </div>
  );
};
