import type { Metadata } from "next";
import { PatientShell, LabReportsView } from "@/components/portals/patient";

export const metadata: Metadata = {
  title: "Lab Reports & Diagnostic Tests | CareSync Patient Portal",
  description: "View verified pathology tests, blood panels, urinalysis results, and diagnostic imaging documents.",
};

export default function PatientLabReportsPage() {
  return (
    <PatientShell>
      <LabReportsView />
    </PatientShell>
  );
}
