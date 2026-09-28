import type { Metadata } from "next";
import { PharmacyShell, HistoryView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Dispensing History & Audit Trail | CareSync Pharmacy",
  description:
    "Archived dispensing records showing completed prescriptions, medications dispensed, patient identification, and pharmacist sign-offs.",
};

export default function PharmacyHistoryPage() {
  return (
    <PharmacyShell activeRoute="/pharmacy/history">
      <HistoryView />
    </PharmacyShell>
  );
}
