import type { Metadata } from "next";
import { LabShell, TestsWorkbenchView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Analytical Tests Workbench | CareSync Diagnostic Portal",
  description:
    "Active diagnostic test runs on automated analyzers: Clinical Chemistry, Hematology, Immunoassays, and Urinalysis.",
};

export default function LabTestsPage() {
  return (
    <LabShell>
      <TestsWorkbenchView />
    </LabShell>
  );
}
