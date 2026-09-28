import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePathologistSession } from "@/lib/auth";
import { Patient, LabReport } from "@/models";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePathologistSession();
    await connectToDatabase();

    const { id } = await params;

    const patient = await Patient.findById(id)
      .populate("userId", "name email avatar phone")
      .lean();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }

    const reportsRaw = await LabReport.find({ patientId: patient._id })
      .populate("doctorId", "name department")
      .sort({ createdAt: -1 })
      .lean();

    const user = patient.userId as any;

    const reports = reportsRaw.map((r: any) => ({
      id: r._id.toString(),
      testName: r.testName,
      department: r.department,
      priority: r.priority,
      status: r.status,
      summary: r.summary,
      sampleId: r.sampleId,
      sampleCollectionDate: r.sampleCollectionDate,
      verifiedDate: r.verifiedDate || r.verifiedAt,
      verifiedBy: r.verifiedBy,
      pathologistInterpretation: r.pathologistInterpretation,
      results: r.results || [],
      doctorName: r.doctorId?.name || "Attending Physician",
    }));

    return NextResponse.json({
      patient: {
        id: patient._id.toString(),
        name: user?.name || "Patient Record",
        email: user?.email || "",
        avatar: user?.avatar || "",
        mrn: patient.mrn,
        dob: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        phone: patient.phone,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        allergies: patient.allergies || [],
      },
      reports,
      totalReports: reports.length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED_PATHOLOGIST") {
      return NextResponse.json(
        { error: "Unauthorized: Pathologist access required." },
        { status: 403 }
      );
    }
    console.error("Pathologist patient detail error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve patient pathology profile." },
      { status: 500 }
    );
  }
}
