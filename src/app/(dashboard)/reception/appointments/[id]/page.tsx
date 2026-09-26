import type { Metadata } from "next";
import { ReceptionShell, AppointmentDetailView } from "@/components/portals/reception";

export const metadata: Metadata = {
  title: "Appointment Details | CareSync Reception",
  description: "View appointment details, reschedule, cancel, or check in patient.",
};

export default function ReceptionAppointmentDetailPage() {
  return (
    <ReceptionShell activeTab="appointments">
      <AppointmentDetailView />
    </ReceptionShell>
  );
}
