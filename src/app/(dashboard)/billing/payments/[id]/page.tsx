import { Metadata } from "next";
import { PaymentDetailView } from "@/components/portals/billing";

export const metadata: Metadata = {
  title: "Payment Receipt | CareSync Financial Operations",
  description: "View printable official transaction receipt and audit record.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PaymentDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <PaymentDetailView id={id} />;
}
