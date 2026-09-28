import type { Metadata } from "next";
import { PharmacyShell, DashboardView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Pharmacy Dashboard | CareSync Dispensary",
  description:
    "Central pharmacy operations dashboard showing pending doctor prescriptions, items ready for dispensing, low-stock alerts, and today's dispensing registry.",
};

export default function PharmacyDashboardPage() {
  return (
    <PharmacyShell activeRoute="/pharmacy/dashboard">
      <DashboardView />
    </PharmacyShell>
  );
}
