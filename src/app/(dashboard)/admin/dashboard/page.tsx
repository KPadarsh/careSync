import { Metadata } from "next";
import { DashboardView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Admin Dashboard | CareSync System Infrastructure",
  description: "Administrative console, personnel overview, facility departments, and duty shifts.",
};

export default function AdminDashboardPage() {
  return <DashboardView />;
}
