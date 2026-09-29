import { Metadata } from "next";
import { ProfileView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Administrator Profile | CareSync System Infrastructure",
  description: "System administrator credentials, facility station, and governance metrics.",
};

export default function AdminProfilePage() {
  return <ProfileView />;
}
