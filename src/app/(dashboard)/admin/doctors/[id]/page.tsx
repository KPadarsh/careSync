import { Metadata } from "next";
import { DoctorDetailView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Doctor Profile | CareSync System Infrastructure",
  description: "View and edit physician specialty, consultation suite, and schedule.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DoctorDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <DoctorDetailView id={id} />;
}
