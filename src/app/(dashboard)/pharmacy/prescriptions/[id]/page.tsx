import type { Metadata } from "next";
import { PharmacyShell, PrescriptionDetailView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Prescription Review & Availability Check | CareSync Pharmacy",
  description:
    "Review physician prescription details, perform real-time inventory checks, initiate dispensing, or request clinical clarifications from prescribing doctors.",
};

export default async function PharmacyPrescriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <PharmacyShell activeRoute="/pharmacy/prescriptions">
      <PrescriptionDetailView id={id} />
    </PharmacyShell>
  );
}
