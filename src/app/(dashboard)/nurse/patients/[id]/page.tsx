import type { Metadata } from "next";
import { NurseShell, PatientOverviewView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Patient Clinical Overview | Nurse Workstation | CareSync",
  description: "Compact clinic patient chart, allergies, vitals intake, and physician handoff.",
};

export default async function NursePatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <NurseShell>
      <PatientOverviewView patientId={id} />
    </NurseShell>
  );
}
