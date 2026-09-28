import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePathologistSession } from "@/lib/auth";
import { Patient, LabReport } from "@/models";

export async function GET(req: NextRequest) {
  try {
    await requirePathologistSession();
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const patientQuery: any = {};
    if (search) {
      const userMatches = (
        await (await import("@/models")).User.find({
          name: { $regex: search, $options: "i" },
        }).select("_id")
      ).map((u) => u._id);

      patientQuery.$or = [
        { mrn: { $regex: search, $options: "i" } },
        { userId: { $in: userMatches } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const patientsRaw = await Patient.find(patientQuery)
      .populate("userId", "name email avatar phone")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch pathology lab report counts per patient
    const patientIds = patientsRaw.map((p) => p._id);
    const reportsSummary = await LabReport.aggregate([
      { $match: { patientId: { $in: patientIds } } },
      {
        $group: {
          _id: "$patientId",
          totalReports: { $sum: 1 },
          verifiedReports: {
            $sum: { $cond: [{ $in: ["$status", ["verified", "finalized"]] }, 1, 0] },
          },
          pendingReports: {
            $sum: {
              $cond: [
                { $in: ["$status", ["submitted_for_review", "under_review", "correction_required"]] },
                1,
                0,
              ],
            },
          },
          lastTestDate: { $max: "$createdAt" },
        },
      },
    ]);

    const summaryMap = new Map();
    reportsSummary.forEach((s) => summaryMap.set(s._id.toString(), s));

    const patients = patientsRaw.map((p: any) => {
      const u = p.userId as any;
      const s = summaryMap.get(p._id.toString()) || {
        totalReports: 0,
        verifiedReports: 0,
        pendingReports: 0,
        lastTestDate: null,
      };

      return {
        id: p._id.toString(),
        name: u?.name || "Patient Record",
        email: u?.email || "",
        avatar: u?.avatar || "",
        mrn: p.mrn,
        dob: p.dateOfBirth,
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        phone: p.phone,
        allergies: p.allergies || [],
        totalReports: s.totalReports,
        verifiedReports: s.verifiedReports,
        pendingReports: s.pendingReports,
        lastTestDate: s.lastTestDate,
      };
    });

    return NextResponse.json({
      patients,
      totalCount: patients.length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist patients list error:", error);
    return NextResponse.json(
      { error: "Failed to load patient records." },
      { status: 500 }
    );
  }
}
