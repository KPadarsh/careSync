import type { Metadata } from "next";
import { LabShell, SampleDetailView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Specimen File & Chain of Custody | CareSync",
  description: "View specimen parameters, barcode token, storage location, and chain of custody audit trail.",
};

export default async function LabSampleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <LabShell>
      <SampleDetailView id={id} />
    </LabShell>
  );
}
