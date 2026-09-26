import type { Metadata } from "next";
import { NurseShell, ProfileView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Staff Nurse Profile | CareSync",
  description: "Workstation credentials and nurse profile management.",
};

export default function NurseProfilePage() {
  return (
    <NurseShell>
      <ProfileView />
    </NurseShell>
  );
}
