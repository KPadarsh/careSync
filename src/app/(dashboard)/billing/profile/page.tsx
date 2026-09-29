import { Metadata } from "next";
import { ProfileView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Billing Staff Profile | CareSync Financial Operations",
  description: "Billing specialist credentials, station details, and role permissions.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
