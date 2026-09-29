import { Metadata } from "next";
import { ReportsView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Administrative Reports | CareSync System Infrastructure",
  description: "Workforce analytics, physician capacity, and departmental operational reports.",
};

export default function AdminReportsPage() {
  return <ReportsView />;
}
