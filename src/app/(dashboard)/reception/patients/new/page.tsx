import type { Metadata } from "next";
import { ReceptionShell, PatientRegisterView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Register Patient | CareSync Reception",
  description: "Register a new outpatient and generate an electronic medical record number (MRN).",
};

export default function RegisterPatientPage() {
  return (
    <ReceptionShell activeTab="patients">
      <PatientRegisterView />
    </ReceptionShell>
  );
}
