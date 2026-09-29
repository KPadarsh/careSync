import { Metadata } from "next";
import { ReportDetailView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Administrative Report View | CareSync System Infrastructure",
  description: "Detailed system and infrastructure report dataset.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ReportDetailView id={id} />;
}
