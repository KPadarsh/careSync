import type { Metadata } from "next";
import { PatientShell, PrescriptionsView } from "@/components/portals/patient";

export const metadata: Metadata = {
  title: "Prescriptions | CareSync Patient Portal",
  description: "Review active medications, dosage schedules, prescribing doctors, and refill requests.",
};

export default function PatientPrescriptionsPage() {
  return (
    <PatientShell>
      <PrescriptionsView />
    </PatientShell>
  );
}
