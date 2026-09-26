import type { Metadata } from "next";
import { DoctorShell, NotificationsView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Clinical Notifications | Doctor Portal | CareSync",
  description: "Alerts on verified lab results, nurse triage completions, and patient queue arrivals.",
};

export default function DoctorNotificationsPage() {
  return (
    <DoctorShell>
      <NotificationsView />
    </DoctorShell>
  );
}
