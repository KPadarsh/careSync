import type { Metadata } from "next";
import { DoctorShell, PatientsView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "My Patients Directory | Doctor Portal | CareSync",
  description: "Search and review clinical records for assigned patients across consultations.",
};

export default function DoctorPatientsPage() {
  return (
    <DoctorShell>
      <PatientsView />
    </DoctorShell>
  );
}
