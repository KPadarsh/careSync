import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireLabSession } from "@/lib/auth";
import { LabReport, Patient, Doctor } from "@/models";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    await requireLabSession();

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status")?.toLowerCase() || "all";
    const priorityFilter = searchParams.get("priority")?.toLowerCase() || "all";
    const departmentFilter = searchParams.get("department")?.toLowerCase() || "all";
    const search = searchParams.get("search")?.trim().toLowerCase();

    const query: any = {};

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "requested") {
        query.status = { $in: ["requested", "pending"] };
      } else if (statusFilter === "sample_pending") {
        query.status = "sample_pending";
      } else if (statusFilter === "sample_collected") {
        query.status = "sample_collected";
      } else if (statusFilter === "processing") {
        query.status = { $in: ["processing", "in-progress"] };
      } else if (statusFilter === "result_entered") {
        query.status = "result_entered";
      } else if (statusFilter === "submitted_for_review") {
        query.status = "submitted_for_review";
      } else if (statusFilter === "completed" || statusFilter === "verified") {
        query.status = { $in: ["verified", "finalized"] };
      } else {
        query.status = statusFilter;
      }
    }

    if (priorityFilter && priorityFilter !== "all") {
      query.priority = priorityFilter;
    }

    if (departmentFilter && departmentFilter !== "all") {
      query.department = { $regex: new RegExp(departmentFilter, "i") };
    }

    const requests = await LabReport.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn dateOfBirth gender bloodGroup phone allergies emergencyContact",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty department qualification roomNumber")
      .populate("sampleDocId")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = requests
      .map((r: any) => {
        const patientName =
          r.patientId?.userId?.name ||
          `${r.patientId?.firstName || ""} ${r.patientId?.lastName || ""}`.trim() ||
          "Patient";

        const age = r.patientId?.dateOfBirth
          ? Math.floor(
              (Date.now() - new Date(r.patientId.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : 35;

        return {
          _id: r._id.toString(),
          testName: r.testName,
          department: r.department,
          priority: r.priority || "routine",
          status: r.status,
          sampleId: r.sampleId,
          sampleDocId: r.sampleDocId?._id?.toString(),
          sampleType: r.sampleType,
          tubeType: r.tubeType,
          barcode: r.barcode,
          requestedDate: r.createdAt || r.sampleCollectionDate,
          sampleCollectedAt: r.sampleCollectedAt,
          sampleCollectedBy: r.sampleCollectedBy,
          processingStartedAt: r.processingStartedAt,
          resultEnteredAt: r.resultEnteredAt,
          submittedForReviewAt: r.submittedForReviewAt,
          submittedBy: r.submittedBy,
          summary: r.summary,
          technicianNotes: r.technicianNotes,
          resultsCount: r.results?.length || 0,
          results: r.results || [],
          patient: {
            _id: r.patientId?._id?.toString(),
            name: patientName,
            mrn: r.patientId?.mrn || "MRN-N/A",
            age,
            gender: r.patientId?.gender || "unknown",
            bloodGroup: r.patientId?.bloodGroup || "O+",
            allergies: r.patientId?.allergies || [],
            phone: r.patientId?.phone || r.patientId?.userId?.phone || "N/A",
            avatar: r.patientId?.userId?.avatar,
          },
          doctor: {
            _id: r.doctorId?._id?.toString(),
            name: r.doctorId?.name || "Dr. Anil Kumar",
            specialty: r.doctorId?.specialty || "Internal Medicine",
            department: r.doctorId?.department || "Cardiology",
          },
        };
      })
      .filter((r) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          r.patient.name.toLowerCase().includes(s) ||
          r.patient.mrn.toLowerCase().includes(s) ||
          r.testName.toLowerCase().includes(s) ||
          r.doctor.name.toLowerCase().includes(s) ||
          (r.sampleId && r.sampleId.toLowerCase().includes(s)) ||
          r.summary.toLowerCase().includes(s)
        );
      });

    return NextResponse.json({ requests: formatted });
  } catch (error: any) {
    console.error("Lab Requests GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load lab requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireLabSession();
    const body = await request.json();

    const { patientId, doctorId, testName, department, priority, summary } = body;

    if (!patientId || !testName) {
      return NextResponse.json(
        { error: "Patient and Test Name are required" },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    let doctorDoc = null;
    if (doctorId) {
      doctorDoc = await Doctor.findById(doctorId);
    }
    if (!doctorDoc) {
      doctorDoc =
        (await Doctor.findOne({ name: /Anil/i })) || (await Doctor.findOne({}));
    }

    const newRequest = await LabReport.create({
      patientId: patient._id,
      doctorId: doctorDoc?._id,
      testName: testName.trim(),
      department: department?.trim() || "Pathology / Clinical Chemistry",
      priority: priority || "routine",
      sampleCollectionDate: new Date(),
      status: "requested",
      summary: summary || `Lab requisition created via technician intake.`,
      verifiedBy: "Pending Lab Processing",
      results: [],
    });

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: `Lab request for ${testName} created successfully.`,
    });
  } catch (error: any) {
    console.error("Lab Requests POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create lab request" },
      { status: 500 }
    );
  }
}
