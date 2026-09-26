import type { Metadata } from "next";
import { ReceptionShell, QueueView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Clinic Queue & Lounge | CareSync Reception",
  description: "Live outpatient arrival triage, room routing, and queue management.",
};

export default function ReceptionQueuePage() {
  return (
    <ReceptionShell activeTab="queue">
      <QueueView />
    </ReceptionShell>
  );
}
