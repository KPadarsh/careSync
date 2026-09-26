import type { Metadata } from "next";
import { DoctorShell, PatientClinicalView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Patient Clinical Chart | Doctor Portal | CareSync",
  description: "Comprehensive patient chart with nursing assessment, vitals, history, prescriptions and pathology reports.",
};

export default async function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DoctorShell>
      <PatientClinicalView patientId={id} />
    </DoctorShell>
  );
}
