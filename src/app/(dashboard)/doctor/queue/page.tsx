import type { Metadata } from "next";
import { DoctorShell, QueueView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Today's Clinical Queue | Doctor Portal | CareSync",
  description: "Live triaged patient queue handed off from nursing for doctor consultation.",
};

export default function DoctorQueuePage() {
  return (
    <DoctorShell>
      <QueueView />
    </DoctorShell>
  );
}
