import { Metadata } from "next";
import { CreateDoctorView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Register Doctor | CareSync System Infrastructure",
  description: "Register a new physician profile and configure working hours.",
};

export default function NewDoctorPage() {
  return <CreateDoctorView />;
}
