import type { Metadata } from "next";
import { LabShell, SamplesView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Specimen Tracking (LabSample) | CareSync",
  description: "Track biological specimens, vacutainer barcode identifiers, collection volumes, and cold storage rack custody.",
};

export default function LabSamplesPage() {
  return (
    <LabShell>
      <SamplesView />
    </LabShell>
  );
}
