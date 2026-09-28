import type { Metadata } from "next";
import { PathologistShell, DashboardView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Pathologist Dashboard | CareSync",
  description:
    "Clinical pathology review workstation tracking reports awaiting review, under active review, recently verified, and items requiring correction.",
};

export default function PathologistDashboardPage() {
  return (
    <PathologistShell activeRoute="Dashboard">
      <DashboardView />
    </PathologistShell>
  );
}
