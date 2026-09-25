import type { Metadata } from "next";
import { PatientShell, MedicalRecordsView } from "@/components/portals/patient";

export const metadata: Metadata = {
  title: "Medical Records | CareSync Patient Portal",
  description: "Access your clinical history, discharge summaries, physician consultation notes, and health records.",
};

export default function PatientMedicalRecordsPage() {
  return (
    <PatientShell>
      <MedicalRecordsView />
    </PatientShell>
  );
}
