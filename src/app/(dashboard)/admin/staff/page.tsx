import { Metadata } from "next";
import { StaffListView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Staff Management | CareSync System Infrastructure",
  description: "Manage hospital personnel, receptionists, nurses, lab technicians, and pharmacists.",
};

export default function AdminStaffPage() {
  return <StaffListView />;
}
