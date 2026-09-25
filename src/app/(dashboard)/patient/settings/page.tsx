import type { Metadata } from "next";
import { PatientShell, SettingsView } from "@/components/portals/patient";

export const metadata: Metadata = {
  title: "Account Settings | CareSync Patient Portal",
  description: "Manage notification preferences, password, security settings, and two-factor authentication.",
};

export default function PatientSettingsPage() {
  return (
    <PatientShell>
      <SettingsView />
    </PatientShell>
  );
}
