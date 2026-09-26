import type { Metadata } from "next";
import { NurseShell, PatientsView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Patients | Nurse Workstation | CareSync",
  description: "Clinic patient directory, vital signs baseline, and triage records.",
};

export default function NursePatientsPage() {
  return (
    <NurseShell>
      <PatientsView />
    </NurseShell>
  );
}
