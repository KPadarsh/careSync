import { Metadata } from "next";
import { CreateDepartmentView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Create Department | CareSync System Infrastructure",
  description: "Establish a new hospital division or administrative unit.",
};

export default function NewDepartmentPage() {
  return <CreateDepartmentView />;
}
