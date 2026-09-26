import type { Metadata } from "next";
import { DoctorShell, FollowUpsView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Clinical Follow-ups | Doctor Portal | CareSync",
  description: "Manage upcoming follow-up milestones, diagnostic prerequisites, and instructions for receptionists.",
};

export default function DoctorFollowUpsPage() {
  return (
    <DoctorShell>
      <FollowUpsView />
    </DoctorShell>
  );
}
