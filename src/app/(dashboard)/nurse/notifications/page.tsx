import type { Metadata } from "next";
import { NurseShell, NotificationsView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Nurse Notifications | CareSync",
  description: "Clinical alerts, abnormal vitals warnings, and station notifications.",
};

export default function NurseNotificationsPage() {
  return (
    <NurseShell>
      <NotificationsView />
    </NurseShell>
  );
}
