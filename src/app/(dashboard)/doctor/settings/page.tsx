import type { Metadata } from "next";
import { DoctorShell, SettingsView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Clinical Settings | Doctor Portal | CareSync",
  description: "Configure consultation duration, room allocation, triage alerts, and safety check protocols.",
};

export default function DoctorSettingsPage() {
  return (
    <DoctorShell>
      <SettingsView />
    </DoctorShell>
  );
}
