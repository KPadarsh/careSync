import type { Metadata } from "next";
import { NurseShell, NursingRecordsView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Nursing Records | CareSync",
  description: "Read-focused nursing history, clinical triage audit, and finalized records.",
};

export default function NurseRecordsPage() {
  return (
    <NurseShell>
      <NursingRecordsView />
    </NurseShell>
  );
}
