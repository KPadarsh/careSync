import { Metadata } from "next";
import { BillingShell, NotificationsView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Billing Notifications | CareSync Financial Operations",
  description: "Financial alerts, payment updates, and overdue account notices.",
};

export default function NotificationsPage() {
  return (
    <BillingShell>
      <NotificationsView />
    </BillingShell>
  );
}
