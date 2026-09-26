import type { Metadata } from "next";
import { Suspense } from "react";
import { ReceptionShell, AppointmentsView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Appointments Directory | CareSync Reception",
  description: "Browse, filter, and manage clinic appointments and doctor rosters.",
};

export default function ReceptionAppointmentsPage() {
  return (
    <ReceptionShell activeTab="appointments">
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading appointments directory...</div>}>
        <AppointmentsView />
      </Suspense>
    </ReceptionShell>
  );
}
