import type { Metadata } from "next";
import { NurseShell, SettingsView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Nurse Workstation Settings | CareSync",
  description: "Workstation triage configuration and clinical alert thresholds.",
};

export default function NurseSettingsPage() {
  return (
    <NurseShell>
      <SettingsView />
    </NurseShell>
  );
}
