import { Metadata } from "next";
import { PaymentsView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Payments | CareSync Financial Operations",
  description: "View and record payments, cashier transactions, and payment methods.",
};

export default function PaymentsPage() {
  return <PaymentsView />;
}
