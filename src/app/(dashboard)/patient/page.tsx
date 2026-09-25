import type { Metadata } from "next";
import { PatientShell, PatientOverview } from "@/components/portals/patient";

export const metadata: Metadata = {
  title: "Patient Dashboard | CareSync",
  description: "CareSync Patient Portal overview, upcoming appointments, and health profile.",
};

export default function PatientDashboardPage() {
  return (
    <PatientShell>
      <PatientOverview patientName="Rahul" />
    </PatientShell>
  );
}
