import type { Metadata } from "next";
import { LabShell, NotificationsView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Laboratory Notifications | CareSync",
  description:
    "Real-time notifications for STAT requisitions, recollection notices, and instrument calibration updates.",
};

export default function LabNotificationsPage() {
  return (
    <LabShell>
      <NotificationsView />
    </LabShell>
  );
}
