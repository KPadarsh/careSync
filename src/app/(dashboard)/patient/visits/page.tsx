import type { Metadata } from "next";
import { PatientShell } from "@/components/portals/patient/PatientShell";
import { VisitsView } from "@/components/portals/patient/VisitsView";

export const metadata: Metadata = {
  title: "My Visits | CareSync Patient Portal",
  description: "View your clinical encounters, diagnosis summaries, and medical visits.",
};

export default function PatientVisitsPage() {
  return (
    <PatientShell>
      <VisitsView />
    </PatientShell>
  );
}
