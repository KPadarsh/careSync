import { Metadata } from "next";
import { BillingShell, OutstandingView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Outstanding Balances | CareSync Financial Operations",
  description: "Accounts receivable, unpaid patient invoices, and aging reports.",
};

export default function OutstandingPage() {
  return (
    <BillingShell>
      <OutstandingView />
    </BillingShell>
  );
}
