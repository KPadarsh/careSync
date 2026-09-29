import { Metadata } from "next";
import { UsersView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Users & Roles | CareSync System Infrastructure",
  description: "User authentication directory, account status, and RBAC role assignments.",
};

export default function AdminUsersPage() {
  return <UsersView />;
}
