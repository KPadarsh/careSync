import { Metadata } from "next";
import { UserDetailView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "User Permissions | CareSync System Infrastructure",
  description: "Manage user account privileges, subsystem roles, and security authorization.",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <UserDetailView id={id} />;
}
