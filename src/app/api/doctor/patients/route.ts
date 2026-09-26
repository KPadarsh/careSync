import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import {
  Patient,
  Doctor,
  Appointment,
  Visit,
  Prescription,
  NursingAssessment,
} from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const filter = searchParams.get("filter") || "all"; // all, my-patients, recent

    let patientQuery: any = {};

    if (filter === "my-patients") {
      patientQuery.$or = [
        { primaryDoctorId: doctorId },
        // Or patients who have had appointments or visits with this doctor
      ];
    }

    const patients = await Patient.find(patientQuery)
      .populate("userId", "name email phone avatar")
      .populate("primaryDoctorId", "name specialty")
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch latest visits and prescriptions for each patient
    const patientIds = patients.map((p: any) => p._id);

    const [latestVisits, latestPrescriptions] = await Promise.all([
      Visit.find({ patientId: { $in: patientIds } })
        .sort({ visitDate: -1 })
        .lean(),
      Prescription.find({ patientId: { $in: patientIds } })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const visitMap: Record<string, any> = {};
    for (const v of latestVisits) {
      const pid = v.patientId.toString();
      if (!visitMap[pid]) visitMap[pid] = v;
    }

    const rxMap: Record<string, any> = {};
    for (const r of latestPrescriptions) {
      const pid = r.patientId.toString();
      if (!rxMap[pid]) rxMap[pid] = r;
    }

    const formatted = patients
      .map((p: any) => {
        const pid = p._id.toString();
        const lastVisit = visitMap[pid];
        const lastRx = rxMap[pid];

        const patientName =
          p.userId?.name ||
          `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
          "Patient";

        const age = p.dateOfBirth
          ? Math.floor(
              (Date.now() - new Date(p.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 32;

        return {
          _id: pid,
          name: patientName,
          mrn: p.mrn || "MRN-N/A",
          gender: p.gender || "male",
          age,
          bloodGroup: p.bloodGroup || "O+",
          phone: p.phone || p.userId?.phone || "N/A",
          email: p.userId?.email || "",
          avatar: p.userId?.avatar,
          allergies: p.allergies || [],
          lastVisitDate: lastVisit?.visitDate || p.updatedAt,
          lastDiagnosis: lastVisit?.diagnosis || "Routine Cardiovascular Checkup",
          activePrescriptionsCount: lastRx?.medications?.length || 0,
          primaryDoctor: p.primaryDoctorId?.name || session.doctor.name,
        };
      })
      .filter((p) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          p.name.toLowerCase().includes(s) ||
          p.mrn.toLowerCase().includes(s) ||
          p.phone.toLowerCase().includes(s) ||
          p.lastDiagnosis.toLowerCase().includes(s)
        );
      });

    return NextResponse.json({
      patients: formatted,
      totalCount: formatted.length,
    });
  } catch (error: any) {
    console.error("Doctor patients list error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load doctor patients" },
      { status: 500 }
    );
  }
}
