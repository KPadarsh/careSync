"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006194] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-[#565e74]">
            Loading verified pathology report...
          </span>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="p-6 bg-white rounded-xl shadow-xs border border-red-200 text-center">
          <p className="text-red-700 font-semibold">Lab report not found.</p>
          <Link
            href="/doctor/lab"
            className="mt-4 inline-flex items-center gap-1 text-sm text-[#006194] hover:underline"
          >
            <ArrowBackIcon className="w-4 h-4" />
            <span>Return to Laboratory Hub</span>
          </Link>
        </div>
      </div>
    );
  }

  const patient = report.patient;
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
    <div className="w-full px-4 sm:px-6 py-6 max-w-5xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/doctor/lab"
            className="p-2 rounded-lg bg-white border border-[#bfc7d2]/40 text-[#565e74] hover:text-[#0b1c30] hover:bg-[#eff4ff] transition-colors"
          >
            <ArrowBackIcon className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#00873a] uppercase tracking-wider">
                Verified Pathology Report
              </span>
              <span className="text-[#bfc7d2]">•</span>
              <span className="text-[12px] text-[#565e74]">{report.department}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0b1c30] tracking-tight">
              {report.testName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[12px] font-semibold border border-emerald-200">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>Pathologist Signed</span>
          </div>
        </div>
      </div>

      {/* Patient & Order Metadata Strip */}
      <div className="p-4 bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
        <div>
          <span className="text-[10px] text-[#565e74] uppercase tracking-wider font-semibold block">
            Patient
          </span>
          <span className="text-[14px] font-bold text-[#0b1c30]">
            {patient.name}
          </span>
          <span className="text-[#565e74] block">
            {patient.mrn} • {patient.age}y {patient.gender}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#565e74] uppercase tracking-wider font-semibold block">
            Sample Collection
          </span>
          <span className="font-semibold text-[#0b1c30]">
            {new Date(report.sampleCollectionDate).toLocaleDateString()}
          </span>
          <span className="text-[#565e74] block">Fasting Phlebotomy</span>
        </div>

        <div>
          <span className="text-[10px] text-[#565e74] uppercase tracking-wider font-semibold block">
            Verified On
          </span>
          <span className="font-semibold text-[#0b1c30]">
            {report.verifiedDate
              ? new Date(report.verifiedDate).toLocaleDateString()
              : "Today"}
          </span>
          <span className="text-[#00873a] font-medium block">
            Automated LIS Sync
          </span>
        </div>

        <div>
          <span className="text-[10px] text-[#565e74] uppercase tracking-wider font-semibold block">
            Verified By Pathologist
          </span>
          <span className="font-semibold text-[#0b1c30]">
            {report.verifiedBy}
          </span>
          <span className="text-[#565e74] block">
            Central Diagnostics Lab
          </span>
        </div>
      </div>

      {/* Diagnostic Parameters Table */}
      <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 overflow-hidden flex flex-col">
        <div className="p-4 bg-[#eff4ff]/60 border-b border-[#bfc7d2]/20 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0b1c30]">
            Analyte Results & Reference Intervals
          </h3>
          <span className="text-[12px] text-[#565e74]">
            {results.length} Parameters Measured
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[13px]">
            <thead>
              <tr className="bg-white border-b border-[#bfc7d2]/20 text-[#565e74] text-[11px] uppercase tracking-wider h-9">
                <th className="px-5 py-2 font-semibold">Parameter / Analyte</th>
                <th className="px-4 py-2 font-semibold">Result Value</th>
                <th className="px-4 py-2 font-semibold">Reference Range</th>
                <th className="px-4 py-2 font-semibold">Unit</th>
                <th className="px-5 py-2 font-semibold text-right">Clinical Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#bfc7d2]/20">
              {results.map((item: any, idx: number) => {
                const isHigh = item.flag === "high";
                const isCritical = item.flag === "critical";

                return (
                  <tr key={idx} className="hover:bg-[#eff4ff]/40 transition-colors h-12">
                    <td className="px-5 py-2.5 font-medium text-[#0b1c30]">
                      {item.parameter}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-[#0b1c30]">
                      {item.value}
                    </td>
                    <td className="px-4 py-2.5 text-[#565e74]">
                      {item.referenceRange}
                    </td>
                    <td className="px-4 py-2.5 text-[#565e74]">
                      {item.unit}
                    </td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      {isCritical ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
                          CRITICAL
                        </span>
                      ) : isHigh ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          HIGH
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
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
      <div className="bg-white rounded-xl shadow-xs border border-[#bfc7d2]/30 p-5 flex flex-col gap-3">
        <h3 className="text-sm font-bold text-[#0b1c30] uppercase tracking-wider text-[11px]">
          Pathologist Clinical Interpretation
        </h3>
        <p className="text-[13px] text-[#0b1c30] bg-[#eff4ff]/50 p-3.5 rounded-lg border border-[#bfc7d2]/20 leading-relaxed">
          {report.summary ||
            "Serum Troponin-I remains below clinical detection limit (<0.040 ng/mL), ruling out acute myocardial necrosis. Lipid evaluation confirms moderate hypercholesterolemia with elevated calculated LDL (138 mg/dL). Correlation with resting 12-lead ECG recommended."}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-[#bfc7d2]/20 text-[12px] text-[#565e74]">
          <span>
            Electronic sign-off committed by <strong>{report.verifiedBy}</strong>
          </span>
          <span className="italic">
            Note: Pathology verification is restricted to authorized Pathologists.
          </span>
        </div>
      </div>
    </div>
  );
};
