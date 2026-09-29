import { Metadata } from "next";
import { DepartmentDetailView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Department Details | CareSync System Infrastructure",
  description: "View department operational guidelines and assigned physicians and staff.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DepartmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <DepartmentDetailView id={id} />;
}
