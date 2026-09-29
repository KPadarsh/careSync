import { Metadata } from "next";
import { NotificationsView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Admin Notifications | CareSync System Infrastructure",
  description: "Administrative notices, shift coverage alerts, and system compliance warnings.",
};

export default function AdminNotificationsPage() {
  return <NotificationsView />;
}
