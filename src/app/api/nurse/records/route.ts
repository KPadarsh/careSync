import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { NursingAssessment, Patient } from "@/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "all" | "completed" | "draft"
    const search = searchParams.get("search");

    let query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const records = await NursingAssessment.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth phone allergies",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    let filtered = records;
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter((r: any) => {
        const name = `${r.patientId?.firstName || ""} ${r.patientId?.lastName || ""} ${r.patientId?.userId?.name || ""}`.toLowerCase();
        const mrn = (r.patientId?.mrn || "").toLowerCase();
        const complaint = (r.chiefComplaint || "").toLowerCase();
        const nurse = (r.nurseName || "").toLowerCase();
        return name.includes(s) || mrn.includes(s) || complaint.includes(s) || nurse.includes(s);
      });
    }

    return NextResponse.json({ records: filtered });
  } catch (error: any) {
    console.error("Nurse records GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load nursing records" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
