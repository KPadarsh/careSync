import type { Metadata } from "next";
import { PharmacyShell, MedicineDetailView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Medicine Details & Stock Management | CareSync Pharmacy",
  description:
    "Review formulary item stock levels, log restock replenishments, adjust location and threshold parameters, and inspect past dispensing records.",
};

export default async function PharmacyMedicineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PharmacyShell activeRoute="/pharmacy/medicines">
      <MedicineDetailView id={id} />
    </PharmacyShell>
  );
}
