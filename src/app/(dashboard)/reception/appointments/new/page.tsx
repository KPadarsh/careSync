import type { Metadata } from "next";
import { Suspense } from "react";
import { ReceptionShell, AppointmentCreateView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Schedule Appointment | CareSync Reception",
  description: "Book an outpatient consultation slot with validated physician availability.",
};

export default function ReceptionNewAppointmentPage() {
  return (
    <ReceptionShell activeTab="appointments">
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading booking interface...</div>}>
        <AppointmentCreateView />
      </Suspense>
    </ReceptionShell>
  );
}
