import type { Metadata } from "next";
import { PatientShell, AppointmentsView } from "@/components/portals/patient";

export const metadata: Metadata = {
  title: "Appointments | CareSync Patient Portal",
  description: "View and manage your upcoming and past doctor appointments, consultations, and schedules.",
};

export default function PatientAppointmentsPage() {
  return (
    <PatientShell>
      <AppointmentsView />
    </PatientShell>
  );
}
