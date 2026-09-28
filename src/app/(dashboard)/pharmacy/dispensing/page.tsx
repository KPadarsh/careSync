import type { Metadata } from "next";
import { PharmacyShell, DispensingView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Dispensing Counter & Fulfillments | CareSync Pharmacy",
  description:
    "Live dispensing counter for preparing medications, lot batch number assignments, prescription label printing, and stock deductions.",
};

export default function PharmacyDispensingPage() {
  return (
    <PharmacyShell activeRoute="/pharmacy/dispensing">
      <DispensingView />
    </PharmacyShell>
  );
}
