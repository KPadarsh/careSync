import { Metadata } from "next";
import { BillingShell, InvoicesView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Invoices | CareSync Financial Operations",
  description: "Manage, search, and filter patient billing invoices.",
};

export default function InvoicesPage() {
  return (
    <BillingShell>
      <InvoicesView />
    </BillingShell>
  );
}
