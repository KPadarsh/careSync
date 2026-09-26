import type { Metadata } from "next";
import { ReceptionShell, PatientDetailView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Patient Details | CareSync Reception",
  description: "View and manage outpatient identity and demographic records.",
};

export default function ReceptionPatientDetailPage() {
  return (
    <ReceptionShell activeTab="patients">
      <PatientDetailView />
    </ReceptionShell>
  );
}
