import type { Metadata } from "next";
import { PatientShell, MessagesView } from "@/components/portals/patient";

export const metadata: Metadata = {
  title: "Messages & Care Team | CareSync Patient Portal",
  description: "Direct secure communications with your physicians, primary care doctor, and clinical support staff.",
};

export default function PatientMessagesPage() {
  return (
    <PatientShell>
      <MessagesView />
    </PatientShell>
  );
}
