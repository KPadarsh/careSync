import type { Metadata } from "next";
import { LabShell, SampleDetailView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Sample Specimen Specification | CareSync",
  description:
    "Specimen chain of custody, thermal barcode print preview, container tube specs, and storage rack management.",
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
