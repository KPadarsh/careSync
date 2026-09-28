import type { Metadata } from "next";
import { PathologistShell, VerifiedReportDetailView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Certified Diagnostic Report | CareSync Pathologist",
  description:
    "Official certified pathology report with cryptographic verification seal, quantitative test results, and formal amendment audit history.",
};

export default async function PathologistVerifiedReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PathologistShell activeRoute="Verified Reports">
      <VerifiedReportDetailView reportId={id} />
    </PathologistShell>
  );
}
