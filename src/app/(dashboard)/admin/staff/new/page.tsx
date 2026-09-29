import { Metadata } from "next";
import { CreateStaffView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Register Staff | CareSync System Infrastructure",
  description: "Register a new hospital staff member and provision user credentials.",
};

export default function NewStaffPage() {
  return <CreateStaffView />;
}
