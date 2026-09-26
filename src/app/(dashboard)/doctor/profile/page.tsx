import type { Metadata } from "next";
import { DoctorShell, ProfileView } from "@/components/portals/doctor";

export const metadata: Metadata = {
  title: "Doctor Profile | CareSync Clinical Portal",
  description: "Doctor profile, medical credentials, consultation room assignments, and security settings.",
};

export default function DoctorProfilePage() {
  return (
    <DoctorShell>
      <ProfileView />
    </DoctorShell>
  );
}
