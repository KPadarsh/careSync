import type { Metadata } from "next";
import { ReceptionShell, SettingsView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Workstation Settings | CareSync Reception",
  description: "Configure reception desk preferences, audio alerts, and workflow presets.",
};

export default function ReceptionSettingsPage() {
  return (
    <ReceptionShell activeTab="settings">
      <SettingsView />
    </ReceptionShell>
  );
}
