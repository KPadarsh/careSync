import { Metadata } from "next";
import { SettingsView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Admin Settings | CareSync System Infrastructure",
  description: "Facility configuration, shift policies, security timeouts, and audit retention.",
};

export default function AdminSettingsPage() {
  return <SettingsView />;
}
