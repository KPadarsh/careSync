import type { Metadata } from "next";
import { ReceptionShell, WalkInView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Walk-in Intake | CareSync Reception",
  description: "Rapid walk-in registration, doctor assignment, and priority queue token issue.",
};

export default function ReceptionWalkInsPage() {
  return (
    <ReceptionShell activeTab="walk-ins">
      <WalkInView />
    </ReceptionShell>
  );
}
