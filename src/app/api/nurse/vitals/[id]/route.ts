import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { Patient, Queue, NursingAssessment } from "@/models";
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid patient ID format" }, { status: 400 });
    }

    const patient = await Patient.findById(id)
      .populate("userId", "name email phone avatar")
      .lean();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const activeQueue = await Queue.findOne({
      patientId: patient._id,
      status: { $in: ["waiting", "in-assessment", "ready-for-doctor", "in-consultation"] },
    })
      .populate("doctorId", "name specialty roomNumber")
      .lean();

    // Fetch all vitals history from nursing assessments
    const assessments = await NursingAssessment.find({
      patientId: patient._id,
      "vitals.recordedAt": { $exists: true },
    })
      .sort({ "vitals.recordedAt": -1, createdAt: -1 })
      .lean();

    const history = assessments.map((a: any) => ({
      _id: a._id,
      vitals: a.vitals,
      nurseName: a.nurseName,
      status: a.status,
      date: a.vitals?.recordedAt || a.createdAt,
      chiefComplaint: a.chiefComplaint,
    }));

    const currentVitals = assessments[0]?.vitals || null;

    return NextResponse.json({
      patient,
      activeQueue,
      currentVitals,
      history,
    });
  } catch (error: any) {
    console.error("Nurse vitals GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load vitals" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await requireNurseSession();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid patient ID format" }, { status: 400 });
    }

    const patient = await Patient.findById(id);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      systolic,
      diastolic,
      bloodPressure,
      heartRate,
      oxygenSaturation,
      temperature,
      respiratoryRate,
      weightKg,
      heightCm,
      painScore,
      notes,
    } = body;

    // Format bloodPressure string if systolic and diastolic provided
    let bpString = bloodPressure;
    if (!bpString && systolic && diastolic) {
      bpString = `${systolic}/${diastolic}`;
    }

    // Calculate BMI
    let bmi: number | undefined = undefined;
    if (weightKg && heightCm && heightCm > 0) {
      const heightM = heightCm / 100;
      bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));
    }

    const vitalsData = {
      bloodPressure: bpString || "120/80",
      systolic: systolic ? Number(systolic) : undefined,
      diastolic: diastolic ? Number(diastolic) : undefined,
      heartRate: heartRate ? Number(heartRate) : undefined,
      oxygenSaturation: oxygenSaturation ? Number(oxygenSaturation) : undefined,
      temperature: temperature ? Number(temperature) : undefined,
      respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      heightCm: heightCm ? Number(heightCm) : undefined,
      bmi,
      painScore: painScore !== undefined ? Number(painScore) : 0,
      recordedAt: new Date(),
      notes: notes || "",
    };

    // Find active queue for today (most recent)
    const activeQueue = await Queue.findOne({
      patientId: patient._id,
      status: { $in: ["waiting", "in-assessment"] },
    }).sort({ createdAt: -1 });

    // If waiting, transition queue to in-assessment
    if (activeQueue && activeQueue.status === "waiting") {
      activeQueue.status = "in-assessment";
      await activeQueue.save();
    }

    // Look for existing draft assessment for this visit/queue or create new draft
    let assessment = await NursingAssessment.findOne({
      patientId: patient._id,
      status: "draft",
    });

    if (assessment) {
      assessment.vitals = vitalsData;
      assessment.nurseId = session.user._id as any;
      assessment.nurseName = `${session.user.name}, RN`;
      if (activeQueue) {
        assessment.queueId = activeQueue._id as any;
        assessment.doctorId = activeQueue.doctorId as any;
      }
      await assessment.save();
    } else {
      assessment = await NursingAssessment.create({
        patientId: patient._id,
        nurseId: session.user._id,
        nurseName: `${session.user.name}, RN`,
        queueId: activeQueue?._id,
        doctorId: activeQueue?.doctorId,
        vitals: vitalsData,
        chiefComplaint: "Triage vitals recorded",
        symptoms: [],
        observations: "Vitals recorded at nurse station.",
        condition: "stable",
        mobility: "independent",
        triagePriority: "normal",
        status: "draft",
      });
    }

    return NextResponse.json({
      message: "Vitals recorded successfully",
      vitals: assessment.vitals,
      assessmentId: assessment._id,
      queueStatus: activeQueue?.status,
    });
  } catch (error: any) {
    console.error("Nurse vitals POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record vitals" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
