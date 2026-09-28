import type { Metadata } from "next";
import { LabShell, SamplesView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Sample & Specimen Management | CareSync Diagnostic Portal",
  description:
    "Track LabSample specimens, standardized SMP-2026 identifiers, non-PII barcode labels, and cold storage racks.",
};

export default function LabSamplesPage() {
  return (
    <LabShell>
      <SamplesView />
    </LabShell>
  );
}
