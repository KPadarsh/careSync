import type { Metadata } from "next";
import { LabShell, RequestDetailView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Lab Request Details & Processing | CareSync",
  description:
    "View clinical order details, collect and record sample with SMP-2026 barcode, process bench assay, and submit results for review.",
};

export default async function LabRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <LabShell>
      <RequestDetailView id={id} />
    </LabShell>
  );
}
