import type { Metadata } from "next";
import { DoctorShell, LabReportsView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Lab & Diagnostic Reports | Doctor Portal | CareSync",
  description: "View verified pathology reports and issue new laboratory test requisitions.",
};

export default function DoctorLabReportsPage() {
  return (
    <DoctorShell>
      <LabReportsView />
    </DoctorShell>
  );
}
