import type { Metadata } from "next";
import { PharmacyShell, SettingsView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Pharmacy Station Settings | CareSync",
  description:
    "Dispensary hardware configuration, Zebra label printer setup, automated inventory cross-checks, and prescription alert settings.",
};

export default function PharmacySettingsPage() {
  return (
    <PharmacyShell activeRoute="/pharmacy/settings">
      <SettingsView />
    </PharmacyShell>
  );
}
