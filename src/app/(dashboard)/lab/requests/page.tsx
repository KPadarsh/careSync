import type { Metadata } from "next";
import { LabShell, RequestsView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Lab Requests | CareSync",
  description: "Doctor-ordered laboratory investigations awaiting collection and processing.",
};

export default function LabRequestsPage() {
  return (
    <LabShell>
      <RequestsView />
    </LabShell>
  );
}
