import type { Metadata } from "next";
import { PathologistShell, ReportsView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Diagnostic Requisitions Queue | CareSync Pathologist",
  description:
    "Review doctor-created lab requests, technician-entered parameter findings, priority indicators, and clinical statuses.",
};

export default function PathologistReportsPage() {
  return (
    <PathologistShell activeRoute="Reports">
      <ReportsView />
    </PathologistShell>
  );
}
