import { Metadata } from "next";
import { BillingShell, CreateInvoiceView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Create Invoice | CareSync Financial Operations",
  description: "Generate a new billable medical invoice for hospital services.",
};

export default function NewInvoicePage() {
  return (
    <BillingShell>
      <CreateInvoiceView />
    </BillingShell>
  );
}
