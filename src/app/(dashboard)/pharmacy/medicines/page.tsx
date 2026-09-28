import type { Metadata } from "next";
import { PharmacyShell, MedicinesView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Medicines & Inventory Formulary | CareSync Pharmacy",
  description:
    "Dispensary formulary inventory catalog tracking available stock counts, units, low-stock trigger thresholds, and rack locations.",
};

export default function PharmacyMedicinesPage() {
  return (
    <PharmacyShell activeRoute="/pharmacy/medicines">
      <MedicinesView />
    </PharmacyShell>
  );
}
