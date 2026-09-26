import type { Metadata } from "next";
import { DoctorShell, DashboardView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Doctor Dashboard | CareSync Clinical Portal",
  description: "Operational clinical dashboard with patients waiting, consultations pending, and quick triage attention.",
};

export default function DoctorDashboardPage() {
  return (
    <DoctorShell>
      <DashboardView />
    </DoctorShell>
  );
}
