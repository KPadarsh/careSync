import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { Queue, Patient } from "@/models";

export default async function NurseAssessmentsIndexPage() {
  await connectToDatabase();
  const queueItem = await Queue.findOne({
    status: { $in: ["waiting", "in-assessment"] },
  }).sort({ priority: -1, checkedInTime: 1 });

  if (queueItem?.patientId) {
    redirect(`/nurse/assessments/${queueItem.patientId.toString()}`);
  }

  const patient = await Patient.findOne({}).sort({ updatedAt: -1 });
  if (patient) {
    redirect(`/nurse/assessments/${patient._id.toString()}`);
  }

  redirect("/nurse/queue");
}
