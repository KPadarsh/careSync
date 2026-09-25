import type { Metadata } from "next";
import { PatientShell, BillingView } from "@/components/portals/patient";

export const metadata: Metadata = {
  title: "Billing & Invoices | CareSync Patient Portal",
  description: "Manage medical bills, insurance claims, invoice receipts, and outstanding hospital balances.",
};

export default function PatientBillingPage() {
  return (
    <PatientShell>
      <BillingView />
    </PatientShell>
  );
}
