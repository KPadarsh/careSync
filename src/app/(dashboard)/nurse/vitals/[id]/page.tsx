import type { Metadata } from "next";
import { NurseShell, VitalsRecordingView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Vitals Recording | Nurse Workstation | CareSync",
  description: "Record patient vital signs, monitor telemetry baseline, and check BMI.",
};

export default async function NurseVitalsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <NurseShell>
      <VitalsRecordingView patientId={id} />
    </NurseShell>
  );
}
