import type { Metadata } from "next";
import { PatientShell } from "@/components/portals/patient/PatientShell";
import { NotificationsView } from "@/components/portals/patient/NotificationsView";

export const metadata: Metadata = {
  title: "Notifications | CareSync Patient Portal",
  description: "View real-time patient notifications, appointment status, lab alerts, and prescription updates.",
};

export default function PatientNotificationsPage() {
  return (
    <PatientShell>
      <NotificationsView />
    </PatientShell>
  );
}
