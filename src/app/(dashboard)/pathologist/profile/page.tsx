import type { Metadata } from "next";
import { PathologistShell, ProfileView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Pathologist Clinical Credentials | CareSync",
  description:
    "Medical licensure, board certifications, and digital signature authorization status for consultant pathologists.",
};

export default function PathologistProfilePage() {
  return (
    <PathologistShell activeRoute="Profile">
      <ProfileView />
    </PathologistShell>
  );
}
