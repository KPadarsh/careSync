import type { Metadata } from "next";
import { LabShell, ResultEntryView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Test Result Entry | CareSync",
  description: "Enter analyzed parameter values, reference ranges, and submit result for Pathologist review.",
};

export default async function LabResultEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <LabShell>
      <ResultEntryView id={id} />
    </LabShell>
  );
}
