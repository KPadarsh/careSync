import type { Metadata } from "next";
import { LabShell, CompletedTestsView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Completed Work Archive | CareSync",
  description: "Historical lab results submitted for review and verified by pathologists.",
};

export default function LabCompletedPage() {
  return (
    <LabShell>
      <CompletedTestsView />
    </LabShell>
  );
}
