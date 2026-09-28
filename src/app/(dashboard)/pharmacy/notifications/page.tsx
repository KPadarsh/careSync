import type { Metadata } from "next";
import { PharmacyShell, NotificationsView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Pharmacy Notifications & Alerts | CareSync",
  description:
    "Real-time notifications for incoming physician prescriptions, inventory threshold alerts, and doctor clarifications.",
};

export default function PharmacyNotificationsPage() {
  return (
    <PharmacyShell activeRoute="/pharmacy/notifications">
      <NotificationsView />
    </PharmacyShell>
  );
}
