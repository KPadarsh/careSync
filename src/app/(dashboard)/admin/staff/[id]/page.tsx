import { Metadata } from "next";
import { StaffDetailView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Staff Details | CareSync System Infrastructure",
  description: "View and edit personnel profile details and status.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StaffDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <StaffDetailView id={id} />;
}
