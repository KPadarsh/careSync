import type { Metadata } from "next";
import { LabShell, RequestsView } from "@/components/portals/lab";

export const metadata: Metadata = {
  title: "Doctor Lab Requests | CareSync Diagnostic Portal",
  description:
    "View doctor-created lab requests, clinical indications, priority triage, and collect samples.",
};

export default function LabRequestsPage() {
  return (
    <LabShell>
      <RequestsView />
    </LabShell>
  );
}
