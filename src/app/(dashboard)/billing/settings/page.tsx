import { Metadata } from "next";
import { BillingShell, SettingsView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Billing Settings | CareSync Financial Operations",
  description: "Configure cashier station, payment collection rules, and receipt formats.",
};

export default function SettingsPage() {
  return (
    <BillingShell>
      <SettingsView />
    </BillingShell>
  );
}
