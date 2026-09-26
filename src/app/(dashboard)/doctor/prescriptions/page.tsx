import type { Metadata } from "next";
import { DoctorShell, PrescriptionsView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Clinical Prescriptions | Doctor Portal | CareSync",
  description: "Prescribe medicines with dosage, frequency, and instructions directly routed to Pharmacy.",
};

export default function DoctorPrescriptionsPage() {
  return (
    <DoctorShell>
      <PrescriptionsView />
    </DoctorShell>
  );
}
