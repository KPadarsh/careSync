import { redirect } from "next/navigation";

export default function DoctorConsultationsRedirectPage() {
  redirect("/doctor/queue");
}
