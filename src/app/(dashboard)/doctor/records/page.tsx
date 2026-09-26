import type { Metadata } from "next";
import { DoctorShell, MedicalRecordsView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Electronic Medical Records | Doctor Portal | CareSync",
  description: "View verified electronic medical records and append signed clinical addendums.",
};

export default function DoctorMedicalRecordsPage() {
  return (
    <DoctorShell>
      <MedicalRecordsView />
    </DoctorShell>
  );
}
