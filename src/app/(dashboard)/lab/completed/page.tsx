import type { Metadata } from "next";
import { LabShell, CompletedView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Completed & Verified Reports Archive | CareSync",
  description:
    "Archive of lab reports submitted for review and verified by Board Certified Pathologist Dr. Sunita Patil, MD.",
};

export default function LabCompletedPage() {
  return (
    <LabShell>
      <CompletedView />
    </LabShell>
  );
}
