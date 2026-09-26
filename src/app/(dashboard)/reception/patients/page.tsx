import type { Metadata } from "next";
import { Suspense } from "react";
import { ReceptionShell, PatientsView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Patient Directory | CareSync Reception",
  description: "Browse, filter, and register patients in the CareSync clinic directory.",
};

export default function ReceptionPatientsPage() {
  return (
    <ReceptionShell activeTab="patients">
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading patients directory...</div>}>
        <PatientsView />
      </Suspense>
    </ReceptionShell>
  );
}
