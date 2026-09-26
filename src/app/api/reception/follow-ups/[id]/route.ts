import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireReceptionSession } from "@/lib/auth";
import { FollowUp } from "@/models";
import { Types } from "mongoose";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    await requireReceptionSession();

    const { id } = await context.params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid follow-up ID" }, { status: 400 });
    }

    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      return NextResponse.json({ error: "Follow-up record not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action, status, scheduledAppointmentId } = body;

    // RBAC: Receptionist can ONLY transition status or link scheduled appointment.
    // CANNOT modify clinicalInstructions or reason!
    if (action === "complete" || status === "completed") {
      followUp.status = "completed";
    } else if (action === "dismiss" || status === "dismissed") {
      followUp.status = "dismissed";
    } else if (action === "schedule" && scheduledAppointmentId) {
      followUp.status = "scheduled";
      followUp.scheduledAppointmentId = new Types.ObjectId(scheduledAppointmentId);
    } else if (status) {
      followUp.status = status;
    }

    await followUp.save();

    const updated = await FollowUp.findById(followUp._id)
      .populate({
        path: "patientId",
        populate: { path: "userId", select: "name email phone" },
      })
      .populate("doctorId", "name specialty department roomNumber");

    return NextResponse.json({
      success: true,
      message: "Follow-up status updated successfully",
      followUp: updated,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED_RECEPTION") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Reception Follow-up PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
