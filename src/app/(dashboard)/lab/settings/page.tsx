import type { Metadata } from "next";
import { LabShell, SettingsView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Laboratory Workstation Settings | CareSync",
  description:
    "Configure diagnostic analyzer bench interfaces, barcode thermal label printer, and panic alert preferences.",
};

export default function LabSettingsPage() {
  return (
    <LabShell>
      <SettingsView />
    </LabShell>
  );
}
