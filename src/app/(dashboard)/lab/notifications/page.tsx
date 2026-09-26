import type { Metadata } from "next";
import { LabShell, NotificationsView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Lab Notifications | CareSync",
  description: "Real-time STAT request alerts, pathologist verification updates, and analyzer status logs.",
};

export default function LabNotificationsPage() {
  return (
    <LabShell>
      <NotificationsView />
    </LabShell>
  );
}
