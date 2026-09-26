import type { Metadata } from "next";
import { ReceptionShell, FollowUpsView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Follow-up Tasks | CareSync Reception",
  description: "Track and schedule physician recall orders, postoperative checks, and test reviews.",
};

export default function ReceptionFollowUpsPage() {
  return (
    <ReceptionShell activeTab="follow-ups">
      <FollowUpsView />
    </ReceptionShell>
  );
}
