import type { Metadata } from "next";
import { ReceptionShell, DashboardView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Reception Dashboard | CareSync",
  description: "CareSync Clinic Receptionist operational dashboard and live arrival triage.",
};

export default function ReceptionDashboardPage() {
  return (
    <ReceptionShell activeTab="dashboard">
      <DashboardView />
    </ReceptionShell>
  );
}
