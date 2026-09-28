import type { Metadata } from "next";
import { LabShell, TestDetailView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Test Result Entry Station | CareSync",
  description:
    "Enter analytical parameter values, units, reference intervals, operational notes, and submit results for pathologist review.",
};

export default async function LabTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <LabShell>
      <TestDetailView id={id} />
    </LabShell>
  );
}
