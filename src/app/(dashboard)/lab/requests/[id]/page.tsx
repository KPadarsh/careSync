import type { Metadata } from "next";
import { LabShell, RequestDetailView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Lab Request Details & Sample Collection | CareSync",
  description: "View doctor order details, record specimen collection, and assign vacutainer barcode.",
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
