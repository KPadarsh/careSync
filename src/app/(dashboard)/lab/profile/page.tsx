import type { Metadata } from "next";
import { LabShell, ProfileView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Technician Profile | CareSync",
  description: "Manage technician credentials, laboratory station assignment, and shift parameters.",
};

export default function LabProfilePage() {
  return (
    <LabShell>
      <ProfileView />
    </LabShell>
  );
}
