import { Metadata } from "next";
import { BillingShell, DashboardView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Billing Dashboard | CareSync Financial Operations",
  description: "Operational billing dashboard, daily revenue metrics, and accounts overview.",
};

export default function BillingDashboardPage() {
  return (
    <BillingShell>
      <DashboardView />
    </BillingShell>
  );
}
