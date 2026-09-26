import type { Metadata } from "next";
import { ReceptionShell, ProfileView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Employee Profile | CareSync Reception",
  description: "View staff credentials, assigned terminal station, and manage security settings.",
};

export default function ReceptionProfilePage() {
  return (
    <ReceptionShell activeTab="profile">
      <ProfileView />
    </ReceptionShell>
  );
}
