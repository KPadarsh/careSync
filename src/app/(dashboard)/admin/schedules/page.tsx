import { Metadata } from "next";
import { SchedulesView } from "@/components/portals/admin";

export const metadata: Metadata = {
  title: "Duty Schedules | CareSync System Infrastructure",
  description: "Staff and doctor shift allocations, weekly rosters, and station coverage.",
};

export default function AdminSchedulesPage() {
  return <SchedulesView />;
}
