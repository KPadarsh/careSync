import { Metadata } from "next";
import { ScheduleDetailView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Duty Shift Details | CareSync System Infrastructure",
  description: "View and modify staff or doctor shift allocation and station assignment.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ScheduleDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <ScheduleDetailView id={id} />;
}
