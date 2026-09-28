import type { Metadata } from "next";
import { PathologistShell, ReportReviewView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Clinical Report Review & Sign-off | CareSync Pathologist",
  description:
    "Inspect analytical parameters, review technician observations, record clinical diagnostic impressions, request corrections, and certify results.",
};

export default async function PathologistReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PathologistShell activeRoute="Reports">
      <ReportReviewView reportId={id} />
    </PathologistShell>
  );
}
