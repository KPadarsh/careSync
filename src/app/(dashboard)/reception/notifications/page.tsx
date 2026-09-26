import type { Metadata } from "next";
import { ReceptionShell, NotificationsView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Alerts & Notifications | CareSync Reception",
  description: "Front desk notifications, urgent queue alerts, and schedule changes.",
};

export default function ReceptionNotificationsPage() {
  return (
    <ReceptionShell activeTab="notifications">
      <NotificationsView />
    </ReceptionShell>
  );
}
