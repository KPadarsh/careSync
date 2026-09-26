import type { Metadata } from "next";
import { DoctorShell, ActiveConsultationView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Active Clinical Consultation | Doctor Portal | CareSync",
  description: "Conduct clinical consultation encounter with SOAP notes, prescription authoring, lab requests and follow-up.",
};

export default async function DoctorConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <DoctorShell>
      <ActiveConsultationView id={id} />
    </DoctorShell>
  );
}
