import type { Metadata } from "next";
import { PathologistShell, NotificationsView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Workstation Alerts | CareSync Pathologist",
  description:
    "STAT laboratory alerts, specimen recollection notices, analyzer panic values, and clinical communications.",
};

export default function PathologistNotificationsPage() {
  return (
    <PathologistShell activeRoute="Notifications">
      <NotificationsView />
    </PathologistShell>
  );
}
