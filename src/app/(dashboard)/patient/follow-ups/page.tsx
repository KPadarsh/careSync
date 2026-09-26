import type { Metadata } from "next";
import { PatientShell } from "@/components/portals/patient/PatientShell";
import { FollowUpsView } from "@/components/portals/patient/FollowUpsView";

export const metadata: Metadata = {
  title: "Follow-ups | CareSync Patient Portal",
  description: "View doctor-directed follow-up instructions and schedule next clinical consultations.",
};

export default function PatientFollowUpsPage() {
  return (
    <PatientShell>
      <FollowUpsView />
    </PatientShell>
  );
}
