import type { Metadata } from "next";
import { NurseShell, DashboardView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Nurse Dashboard | CareSync",
  description: "CareSync Nurse Workstation operational dashboard and clinical triage intake.",
};

export default function NurseDashboardPage() {
  return (
    <NurseShell>
      <DashboardView />
    </NurseShell>
  );
}
