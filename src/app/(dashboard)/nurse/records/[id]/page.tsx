import type { Metadata } from "next";
import { NurseShell, NursingRecordDetailView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Nursing Record Archive | CareSync",
  description: "Detailed read-only nursing assessment and vitals audit log.",
};

export default async function NurseRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <NurseShell>
      <NursingRecordDetailView recordId={id} />
    </NurseShell>
  );
}
