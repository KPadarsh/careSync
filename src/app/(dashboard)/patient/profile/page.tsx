import type { Metadata } from "next";
import { PatientShell, ProfileView } from "@/components/portals/patient";

export const metadata: Metadata = {
  title: "Profile & Demographics | CareSync Patient Portal",
  description: "View and update your personal details, emergency contacts, blood group, and insurance policies.",
};

export default function PatientProfilePage() {
  return (
    <PatientShell>
      <ProfileView />
    </PatientShell>
  );
}
