import type { Metadata } from "next";
import { LabShell, DashboardView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Lab Technician Dashboard | CareSync Diagnostic Portal",
  description:
    "Operational laboratory workstation tracking doctor requisitions, pending specimens, analytical workbenches, and results awaiting pathologist review.",
};

export default function LabDashboardPage() {
  return (
    <LabShell>
      <DashboardView />
    </LabShell>
  );
}
