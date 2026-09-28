import type { Metadata } from "next";
import { PharmacyShell, PrescriptionsView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Doctor Prescriptions Queue | CareSync Pharmacy",
  description:
    "Review physician prescriptions, check formulary availability, verify patient allergy status, and transition orders into the dispensing workflow.",
};

export default function PharmacyPrescriptionsPage() {
  return (
    <PharmacyShell activeRoute="/pharmacy/prescriptions">
      <PrescriptionsView />
    </PharmacyShell>
  );
}
