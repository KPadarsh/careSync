import { Suspense } from "react";
import type { Metadata } from "next";
import { DoctorShell, PatientsView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "My Patients Directory | Doctor Portal | CareSync",
  description: "Search and review clinical records for assigned patients across consultations.",
};

export default function DoctorPatientsPage() {
  return (
    <DoctorShell>
      <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading patients directory...</div>}>
        <PatientsView />
      </Suspense>
    </DoctorShell>
  );
}

