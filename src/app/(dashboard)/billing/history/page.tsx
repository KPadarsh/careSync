import { Metadata } from "next";
import { HistoryView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Billing History & Audit Ledger | CareSync Financial Operations",
  description: "Complete financial history and cashier transaction ledger.",
};

export default function HistoryPage() {
  return <HistoryView />;
}
