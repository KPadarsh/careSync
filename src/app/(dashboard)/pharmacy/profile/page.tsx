import type { Metadata } from "next";
import { PharmacyShell, ProfileView } from "@/components/portals/pharmacy";

export const metadata: Metadata = {
  title: "Pharmacist Profile & Credentials | CareSync",
  description:
    "Dispensary lead pharmacist credential profile, shift schedules, clinical scope of practice boundaries, and on-call emergency contacts.",
};

export default function PharmacyProfilePage() {
  return (
    <PharmacyShell activeRoute="/pharmacy/profile">
      <ProfileView />
    </PharmacyShell>
  );
}
