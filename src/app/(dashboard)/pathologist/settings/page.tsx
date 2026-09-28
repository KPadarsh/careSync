import type { Metadata } from "next";
import { PathologistShell, SettingsView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Pathology Workstation Settings | CareSync",
  description:
    "Configure panic value alert thresholds, electronic signature stamp defaults, and auto-notification triggers.",
};

export default function PathologistSettingsPage() {
  return (
    <PathologistShell activeRoute="Settings">
      <SettingsView />
    </PathologistShell>
  );
}
