import type { Metadata } from "next";
import { DoctorShell, LabReportDetailView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Lab Report Detail | Doctor Portal | CareSync",
  description: "View verified pathology findings and diagnostic test results.",
};

export default async function DoctorLabReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DoctorShell>
      <LabReportDetailView id={id} />
    </DoctorShell>
  );
}
