"use client";

import React, { useEffect, useState } from "react";
import {
  BillingShell,
  UserIcon,
  ShieldIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  DollarSignIcon,
  FileTextIcon,
  CreditCardIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
} from "./BillingShell";

interface BillingProfile {
  name: string;
  role: string;
  email: string;
  phone: string;
  department: string;
  badgeId: string;
  shift: string;
  station: string;
  metrics: {
    invoicesCreated: number;
    paymentsCollected: number;
    totalAmountCollected: number;
  };
}

export function ProfileView() {
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/billing/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.profile);
        }
      })
      .catch((err) => console.error("Error loading profile:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <BillingShell activeKey="profile">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-bold text-white shadow-inner flex-shrink-0">
              MN
            </div>
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                Active Staff • Financial Operations
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {profile?.name || "Meera Nair"}
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                {profile?.role || "Senior Billing Specialist"} • {profile?.department || "Finance & Revenue Cycle Management"}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <MailIcon className="w-3.5 h-3.5 text-blue-400" />
                  {profile?.email || "meera@billing.caresync.com"}
                </span>
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="w-3.5 h-3.5 text-blue-400" />
                  {profile?.phone || "+1 (555) 890-4421"}
                </span>
                <span className="flex items-center gap-1.5">
                  <BuildingIcon className="w-3.5 h-3.5 text-blue-400" />
                  Station: {profile?.station || "Desk B-1, Ground Floor Cashier"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Career / Metric summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Invoices Generated
              </span>
              <FileTextIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {profile?.metrics.invoicesCreated ?? 5}
            </div>
            <div className="text-xs text-slate-500 mt-1">Across clinical services</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Receipts Processed
              </span>
              <CreditCardIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">
              {profile?.metrics.paymentsCollected ?? 3}
            </div>
            <div className="text-xs text-slate-500 mt-1">Completed transactions</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Reconciled Volume
              </span>
              <DollarSignIcon className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">
              ${(profile?.metrics.totalAmountCollected ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-xs text-slate-500 mt-1">Zero register discrepancies</div>
          </div>
        </div>

        {/* Role Governance & Boundaries */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <ShieldIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Role Permissions & Compliance Boundaries
              </h2>
              <p className="text-xs text-slate-500">
                HIPAA-compliant role segregation: Billing Specialist privileges
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allowed */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle2Icon className="w-4 h-4 text-emerald-600" />
                Authorized Financial Operations
              </div>
              <ul className="text-xs text-emerald-950 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Generate billable invoices from cataloged hospital services
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Collect patient payments (cash, card, UPI, bank transfer, insurance)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Issue verified transaction receipts & statements
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Track accounts receivable, overdue balances & payment plans
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">•</span>
                  Access patient financial contact & billing history ledger
                </li>
              </ul>
            </div>

            {/* Disallowed */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-sm">
                <AlertCircleIcon className="w-4 h-4 text-rose-600" />
                Strictly Restricted Boundaries
              </div>
              <ul className="text-xs text-rose-950 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <strong>No Discharge Permissions:</strong> Cannot initiate, authorize, or modify patient discharge
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <strong>No Clinical Editing:</strong> Cannot view or modify clinical diagnosis, doctor notes, or charts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <strong>No Prescriptions:</strong> Cannot dispense, prescribe, or alter pharmaceuticals
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <strong>No Lab Reports:</strong> Cannot access or verify clinical pathology or diagnostic lab results
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-500 font-bold">•</span>
                  <strong>No User Admin:</strong> Cannot grant credentials or system-wide admin privileges
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </BillingShell>
  );
}
