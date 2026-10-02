import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { DispensingRecord, Prescription, Medicine, Notification, Patient } from "@/models";
import { NotificationService } from "@/services/notification.service";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const { id } = await context.params;

    const record = await DispensingRecord.findById(id)
      .populate("patientId", "name mrn gender dateOfBirth bloodGroup phone allergies emergencyContact")
      .populate("doctorId", "name specialty department qualification roomNumber")
      .populate("prescriptionId")
      .lean();

    if (!record) {
      return NextResponse.json(
        { error: "Dispensing record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (error: any) {
    console.error("Pharmacy dispensing detail GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dispensing record" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requirePharmacySession();
    await connectToDatabase();

    const { id } = await context.params;
    const body = await req.json();
    const { action: rawAction, status, notes, items } = body;
    const action = rawAction || (status === "completed" ? "complete" : status === "dispensed" ? "dispense" : status);

    const record = await DispensingRecord.findById(id);
    if (!record) {
      return NextResponse.json(
        { error: "Dispensing record not found" },
        { status: 404 }
      );
    }

    // Update items if provided (batches or quantities)
    if (items && Array.isArray(items)) {
      record.items = items;
    }

    if (notes) {
      record.notes = notes;
    }

    if (action === "prepare") {
      record.status = "preparing";
      await record.save();

      return NextResponse.json({
        success: true,
        message: "Dispensing record marked as Preparing in dispensary.",
        record,
      });
    }

    if (action === "dispense" || action === "complete") {
      const isFinishing = action === "complete" || action === "dispense";

      // If transition from 'preparing' to 'dispensed' or 'completed', deduct medicine stock
      if (record.status === "preparing") {
        for (const item of record.items) {
          const searchKeyword = item.medicineName.split(" ")[0];
          const med = await Medicine.findOne({
            $or: [
              { name: { $regex: searchKeyword, $options: "i" } },
              { genericName: { $regex: searchKeyword, $options: "i" } },
            ],
          });

          if (med) {
            const deductQty = item.quantityDispensed || 0;
            med.availableQuantity = Math.max(0, med.availableQuantity - deductQty);
            // Pre-save hook recalculates status (in_stock, low_stock, out_of_stock)
            await med.save();

            // Notify if low stock
            if (med.status === "low_stock" || med.status === "out_of_stock") {
              await Notification.create({
                recipientId: session.user._id,
                title: `Inventory Warning: ${med.name}`,
                message: `Available quantity reduced to ${med.availableQuantity} ${med.unit} (Threshold: ${med.lowStockThreshold}).`,
                type: "prescription",
                link: `/pharmacy/medicines`,
                isRead: false,
              });
            }
          }
        }
      }

      record.status = action === "complete" ? "completed" : "dispensed";
      record.dispensedDate = new Date();
      record.pharmacistName = session.user.name || "Pharmacist";
      await record.save();

      // Update parent prescription status
      if (record.prescriptionId) {
        await Prescription.findByIdAndUpdate(record.prescriptionId, {
          status: action === "complete" ? "completed" : "dispensed",
          pharmacistNotes: `Dispensed on ${new Date().toLocaleDateString()} by ${record.pharmacistName}.`,
        });
      }

      // Notify billing specialists and patient via NotificationService
      try {
        const medNames = record.items.map((i) => i.medicineName).join(", ");
        const patientDoc = await Patient.findById(record.patientId);
        const patientName = patientDoc ? `${patientDoc.firstName} ${patientDoc.lastName}` : "Patient";

        await NotificationService.notifyRole("BILLING_STAFF", {
          title: "Prescription Dispensed",
          message: `Medications (${medNames}) dispensed for ${patientName}. Ready for billing clearance.`,
          type: "billing",
          link: "/billing/invoices/new",
          relatedResource: {
            resourceType: "dispensing",
            resourceId: record._id.toString(),
          },
        });

        if (patientDoc?.userId) {
          await NotificationService.createNotification({
            recipientUserId: patientDoc.userId,
            title: "Prescription Dispensed",
            message: `Your prescription (${medNames}) has been prepared and dispensed by Pharmacist ${record.pharmacistName}.`,
            type: "prescription",
            link: "/patient/prescriptions",
            relatedResource: {
              resourceType: "dispensing",
              resourceId: record._id.toString(),
            },
          });
        }
      } catch (notifErr) {
        console.error("Failed to notify billing and patient of dispensing:", notifErr);
      }

      // Record audit log
      await logAuditEvent({
        actor: {
          userId: session.user._id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        },
        action: "MEDICATIONS_DISPENSED",
        resource: `Dispensing Record ${record.dispenseId}`,
        resourceType: "dispensing",
        metadata: {
          dispenseId: record.dispenseId,
          prescriptionId: record.prescriptionId,
          patientId: record.patientId,
          itemsCount: record.items?.length,
        },
      });

      return NextResponse.json({
        success: true,
        message:
          action === "complete"
            ? "Dispensing completed and recorded in permanent pharmacy registry."
            : "Medications dispensed and inventory deducted.",
        record,
      });
    }

    if (action === "cancel") {
      record.status = "cancelled";
      await record.save();

      if (record.prescriptionId) {
        await Prescription.findByIdAndUpdate(record.prescriptionId, {
          status: "ready",
          pharmacistNotes: "Dispensing cancelled; returned to ready queue.",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Dispensing operation cancelled.",
        record,
      });
    }

    await record.save();
    return NextResponse.json({
      success: true,
      message: "Dispensing record updated.",
      record,
    });
  } catch (error: any) {
    console.error("Pharmacy dispensing detail PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update dispensing record" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}
