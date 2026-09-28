import type { Metadata } from "next";
import { PathologistShell, VerifiedReportsView } from "@/components/portals/pathologist";

export const metadata: Metadata = {
  title: "Verified Diagnostic Reports | CareSync Pathologist",
  description:
    "Read-only finalized diagnostic reports released for clinical consumption by attending physicians.",
};

export default function PathologistVerifiedReportsPage() {
  return (
    <PathologistShell activeRoute="Verified Reports">
      <VerifiedReportsView />
    </PathologistShell>
  );
}
