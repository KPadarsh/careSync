import type { Metadata } from "next";
import { PharmacyShell, DispensingDetailView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Dispensing Order Details & Packaging | CareSync Pharmacy",
  description:
    "Fulfill prescription dispensing orders, verify medication counts, preview auxiliary prescription warning labels, and finalize pharmacist signature.",
};

export default async function PharmacyDispensingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PharmacyShell activeRoute="/pharmacy/dispensing">
      <DispensingDetailView id={id} />
    </PharmacyShell>
  );
}
