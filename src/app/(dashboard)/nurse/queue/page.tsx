import type { Metadata } from "next";
import { NurseShell, QueueView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Patient Queue | Nurse Workstation | CareSync",
  description: "Live clinic triage queue for vital signs intake and nursing assessment.",
};

export default function NurseQueuePage() {
  return (
    <NurseShell>
      <QueueView />
    </NurseShell>
  );
}
