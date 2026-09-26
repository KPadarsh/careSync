import type { Metadata } from "next";
import { LabShell, TestsQueueView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Active Tests Worklist | CareSync",
  description: "Diagnostic investigations undergoing analyzer calibration, processing, and parameter entry.",
};

export default function LabTestsPage() {
  return (
    <LabShell>
      <TestsQueueView />
    </LabShell>
  );
}
