import { Metadata } from "next";
import { BillingShell, PaymentsView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Payments | CareSync Financial Operations",
  description: "View and record payments, cashier transactions, and payment methods.",
};

export default function PaymentsPage() {
  return (
    <BillingShell>
      <PaymentsView />
    </BillingShell>
  );
}
