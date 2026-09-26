import type { Metadata } from "next";
import { NurseShell, TasksView } from "@/components/portals/nurse";

export const metadata: Metadata = {
  title: "Nursing Tasks | CareSync",
  description: "Manage nursing tasks, medication schedules, and clinical station duties.",
};

export default function NurseTasksPage() {
  return (
    <NurseShell>
      <TasksView />
    </NurseShell>
  );
}
