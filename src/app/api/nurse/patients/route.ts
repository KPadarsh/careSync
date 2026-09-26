import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { Patient, NursingAssessment, Queue } from "@/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let query: any = {};
    if (search) {
      const s = search.trim();
      query = {
        $or: [
          { firstName: { $regex: s, $options: "i" } },
          { lastName: { $regex: s, $options: "i" } },
          { mrn: { $regex: s, $options: "i" } },
          { phone: { $regex: s, $options: "i" } },
        ],
      };
    }

    const patients = await Patient.find(query)
      .populate("userId", "name email phone avatar")
      .populate("primaryDoctorId", "name specialty")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    // Attach latest vitals & active queue if checked in
    const patientIds = patients.map((p: any) => p._id);

    const [assessments, activeQueues] = await Promise.all([
      NursingAssessment.find({ patientId: { $in: patientIds } })
        .sort({ createdAt: -1 })
        .lean(),
      Queue.find({
        patientId: { $in: patientIds },
        status: { $in: ["waiting", "in-assessment", "ready-for-doctor", "in-consultation"] },
      }).lean(),
    ]);

    const latestAssessmentByPatient: Record<string, any> = {};
    for (const a of assessments) {
      const pid = a.patientId.toString();
      if (!latestAssessmentByPatient[pid]) {
        latestAssessmentByPatient[pid] = a;
      }
    }

    const activeQueueByPatient: Record<string, any> = {};
    for (const q of activeQueues) {
      const pid = q.patientId.toString();
      activeQueueByPatient[pid] = q;
    }

    const enriched = patients.map((p: any) => {
      const pid = p._id.toString();
      const assessment = latestAssessmentByPatient[pid];
      const activeQueue = activeQueueByPatient[pid];
      return {
        ...p,
        latestVitals: assessment?.vitals || null,
        latestAssessment: assessment || null,
        activeQueue: activeQueue || null,
      };
    });

    return NextResponse.json({ patients: enriched });
  } catch (error: any) {
    console.error("Nurse patients GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load patients" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
