import type { Metadata } from "next";
import { NurseShell, NursingAssessmentView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Nursing Assessment | CareSync",
  description: "Comprehensive nursing assessment, triage scoring, and physician handoff.",
};

export default async function NurseAssessmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <NurseShell>
      <NursingAssessmentView patientId={id} />
    </NurseShell>
  );
}
