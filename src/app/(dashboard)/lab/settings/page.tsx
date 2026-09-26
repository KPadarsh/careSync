import type { Metadata } from "next";
import { LabShell, SettingsView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Laboratory Settings | CareSync",
  description: "Configure diagnostic station parameters, barcode formatting, and analyzer integration flags.",
};

export default function LabSettingsPage() {
  return (
    <LabShell>
      <SettingsView />
    </LabShell>
  );
}
