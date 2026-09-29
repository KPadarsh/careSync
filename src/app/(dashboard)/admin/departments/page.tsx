import { Metadata } from "next";
import { DepartmentsListView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Departments | CareSync System Infrastructure",
  description: "Manage hospital medical departments, facilities, and staff allocations.",
};

export default function AdminDepartmentsPage() {
  return <DepartmentsListView />;
}
