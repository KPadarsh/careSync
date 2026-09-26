import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireDoctorSession } from "@/lib/auth";
import { LabReport, Patient, Doctor } from "@/models";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter")?.toLowerCase() || "all";
    const search = searchParams.get("search")?.trim().toLowerCase();

    let query: any = {
      $or: [
        { doctorId },
        { department: { $regex: /cardiology|general|pathology|internal/i } },
      ],
    };

    if (filter && filter !== "all") {
      if (filter === "requested") {
        query.status = "pending";
      } else if (filter === "collected" || filter === "processing") {
        query.status = "in-progress";
      } else if (filter === "ready") {
        query.status = "finalized";
      } else if (filter === "verified") {
        query.status = "verified";
      }
    }

    const reports = await LabReport.find(query)
      .populate({
        path: "patientId",
        select: "firstName lastName mrn bloodGroup gender dateOfBirth",
        populate: { path: "userId", select: "name email phone avatar" },
      })
      .populate("doctorId", "name specialty")
      .sort({ verifiedDate: -1, sampleCollectionDate: -1 })
      .lean();

    const formatted = reports
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
          : 32;

        return {
          _id: r._id.toString(),
          testName: r.testName,
          department: r.department || "Clinical Chemistry",
          sampleCollectionDate: r.sampleCollectionDate,
          verifiedDate: r.verifiedDate,
          status: r.status,
          summary: r.summary,
          verifiedBy: r.verifiedBy || "Dr. Sunita Patil, MD Pathology",
          resultsCount: r.results?.length || 0,
          results: r.results || [],
          fileUrl: r.fileUrl,
          patient: {
            _id: r.patientId?._id?.toString(),
            name: patientName,
            mrn: r.patientId?.mrn || "MRN-N/A",
            age,
            gender: r.patientId?.gender || "male",
            bloodGroup: r.patientId?.bloodGroup || "O+",
            avatar: r.patientId?.userId?.avatar,
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
          r.summary.toLowerCase().includes(s)
        );
      });

    // Compute metrics
    const totalRequests = await LabReport.countDocuments({
      $or: [{ doctorId }, { department: { $regex: /cardiology|general|pathology|internal/i } }],
    });
    const inAnalysis = await LabReport.countDocuments({
      status: { $in: ["pending", "in-progress"] },
      $or: [{ doctorId }, { department: { $regex: /cardiology|general|pathology|internal/i } }],
    });
    const resultsReady = await LabReport.countDocuments({
      status: "finalized",
      $or: [{ doctorId }, { department: { $regex: /cardiology|general|pathology|internal/i } }],
    });
    const verified = await LabReport.countDocuments({
      status: "verified",
      $or: [{ doctorId }, { department: { $regex: /cardiology|general|pathology|internal/i } }],
    });

    return NextResponse.json({
      reports: formatted,
      stats: {
        totalRequests,
        inAnalysis,
        resultsReady,
        verified,
      },
    });
  } catch (error: any) {
    console.error("Doctor lab GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load lab reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const session = await requireDoctorSession();
    const doctorId = session.doctor._id;
    const body = await request.json();

    const { patientId, testName, department, priority, clinicalReason, instructions } = body;

    if (!patientId || !testName) {
      return NextResponse.json(
        { error: "Patient ID and Test Name are required" },
        { status: 400 }
      );
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Doctor creates lab request -> Dispatched to Lab Technician
    const labOrder = await LabReport.create({
      patientId: patient._id,
      doctorId,
      testName: testName.trim(),
      department: department?.trim() || "Pathology / Clinical Chemistry",
      sampleCollectionDate: new Date(),
      status: "pending", // Lab technician status
      summary: `Clinical Order: ${clinicalReason || "Diagnostic evaluation"}. Priority: ${priority || "routine"}.${instructions ? ` Instructions: ${instructions}` : ""}`,
      verifiedBy: "Pending Lab Processing",
      results: [],
    });

    return NextResponse.json({
      success: true,
      message: `Lab requisition for ${testName} created and dispatched to Lab Technician.`,
      labReport: {
        _id: labOrder._id.toString(),
        testName: labOrder.testName,
        status: labOrder.status,
        createdAt: labOrder.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Doctor lab requisition POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create lab requisition" },
      { status: 500 }
    );
  }
}
