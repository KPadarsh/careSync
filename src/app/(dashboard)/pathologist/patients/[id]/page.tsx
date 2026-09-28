import type { Metadata } from "next";
import { PathologistShell, PatientDetailView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Longitudinal Patient Pathology Record | CareSync",
  description:
    "Cumulative laboratory test findings, historical pathology interpretations, and clinical trends.",
};

export default async function PathologistPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PathologistShell activeRoute="Patients">
      <PatientDetailView patientId={id} />
    </PathologistShell>
  );
}
