import type { Metadata } from "next";
import { LabShell, ProfileView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Lab Technologist Profile | CareSync",
  description:
    "Credentials, active workstation assignment, license details, and personal contact info for Vikram Malhotra, MLT.",
};

export default function LabProfilePage() {
  return (
    <LabShell>
      <ProfileView />
    </LabShell>
  );
}
