import { Metadata } from "next";
import { AuditLogsView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Audit Logs | CareSync System Infrastructure",
  description: "Read-only server-side security audit trail of all administrative actions.",
};

export default function AdminAuditLogsPage() {
  return <AuditLogsView />;
}
