import type { Metadata } from "next";
import { LabShell, DashboardView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Lab Technician Dashboard | CareSync",
  description: "CareSync Diagnostic Laboratory operational dashboard and specimen tracking.",
};

export default function LabDashboardPage() {
  return (
    <LabShell>
      <DashboardView />
    </LabShell>
  );
}
