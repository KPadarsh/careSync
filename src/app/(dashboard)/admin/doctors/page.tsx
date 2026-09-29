import { Metadata } from "next";
import { DoctorsListView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Doctor Registry | CareSync System Infrastructure",
  description: "Manage physician profiles, specialties, consultation rooms, and availability.",
};

export default function AdminDoctorsPage() {
  return <DoctorsListView />;
}
