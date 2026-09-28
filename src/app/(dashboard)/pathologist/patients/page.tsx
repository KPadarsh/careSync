import type { Metadata } from "next";
import { PathologistShell, PatientsView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Patient Pathology Roster | CareSync Pathologist",
  description:
    "Longitudinal diagnostic records, patient demographics, and cumulative laboratory test results.",
};

export default function PathologistPatientsPage() {
  return (
    <PathologistShell activeRoute="Patients">
      <PatientsView />
    </PathologistShell>
  );
}
