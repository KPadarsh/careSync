import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireNurseSession } from "@/lib/auth";
import { NurseTask, Patient } from "@/models";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "all", "pending", "completed"

    const query: any = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const tasks = await NurseTask.find(query)
      .populate("patientId", "firstName lastName mrn")
      .sort({ status: 1, priority: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Nurse tasks GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load tasks" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const session = await requireNurseSession();

    const body = await request.json();
    const { title, description, patientId, roomNumber, dueTime, priority, category } = body;

    if (!title) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    let patientName = "";
    if (patientId) {
      const pat = await Patient.findById(patientId).populate("userId", "name");
      if (pat) {
        patientName =
          pat.firstName && pat.lastName
            ? `${pat.firstName} ${pat.lastName}`
            : (pat.userId as any)?.name || "Patient";
      }
    }

    const task = await NurseTask.create({
      title,
      description,
      patientId: patientId || undefined,
      patientName: patientName || undefined,
      nurseId: session.user._id,
      nurseName: `${session.user.name}, RN`,
      roomNumber: roomNumber || "Room 302",
      dueTime: dueTime || "11:30 AM",
      priority: priority === "urgent" ? "urgent" : "normal",
      status: "pending",
      category: category || "general",
    });

    return NextResponse.json({ message: "Task created successfully", task });
  } catch (error: any) {
    console.error("Nurse task POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await connectToDatabase();
    await requireNurseSession();

    const body = await request.json();
    const { taskId, status } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const task = await NurseTask.findById(taskId);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (status) {
      task.status = status;
      if (status === "completed") {
        task.completedAt = new Date();
      } else {
        task.completedAt = undefined;
      }
    }

    await task.save();

    return NextResponse.json({ message: "Task updated successfully", task });
  } catch (error: any) {
    console.error("Nurse task PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: error.message?.includes("UNAUTHORIZED") ? 401 : 500 }
    );
  }
}
