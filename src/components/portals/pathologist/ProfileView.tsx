"use client";

import React, { useState, useEffect } from "react";
import { UserIcon, VerifiedIcon, MicroscopeIcon } from "./PathologistIcons";

export function ProfileView() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/pathologist/profile");
        if (res.ok) {
          const json = await res.json();
          setProfile(json.profile);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading || !profile) {
    return (
      <div className="flex-1 p-10 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#00355f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-6 max-w-5xl mx-auto w-full">
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002444] tracking-tight">
          Pathologist Clinical Credentials
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Medical license, board certifications, and digital signature authorization status.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 border-b border-slate-100 pb-6">
          <div className="w-20 h-20 rounded-2xl bg-[#002444] text-[#94f2ef] flex items-center justify-center font-bold text-2xl border border-white/20 shadow-md">
            SP
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                ACTIVE • LICENSED
              </span>
            </div>
            <p className="text-xs font-semibold text-[#006a68]">{profile.title}</p>
            <p className="text-xs text-slate-500">{profile.email} • {profile.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Medical Board Licensure
            </span>
            <div className="font-mono text-sm font-bold text-slate-900">
              {profile.medicalLicense}
            </div>
            <p className="text-slate-500 text-[11px]">
              Full Clinical Pathology &amp; Anatomic Pathology Practice Authority
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Workstation &amp; Laboratory
            </span>
            <div className="font-semibold text-slate-900 text-sm">{profile.facility}</div>
            <p className="text-slate-500 text-[11px]">{profile.workstation}</p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Board Certifications &amp; Fellowships
          </h3>
          <div className="space-y-2">
            {profile.boardCertifications?.map((cert: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <VerifiedIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-800 font-medium">{cert}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Supervised Clinical Diagnostic Benches
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.departmentsSupervised?.map((dept: string, idx: number) => (
              <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                {dept}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>Total Certified Reports: <strong className="text-slate-800">{profile.totalVerifiedReports}</strong></div>
          <div>Pending in Queue: <strong className="text-amber-700">{profile.activeReviewQueue}</strong></div>
        </div>
      </div>
    </div>
  );
}
