import { Metadata } from "next";
import { InvoiceDetailView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Invoice Details | CareSync Financial Operations",
  description: "View invoice itemization, outstanding balance, and collect payments.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <InvoiceDetailView id={id} />;
}
