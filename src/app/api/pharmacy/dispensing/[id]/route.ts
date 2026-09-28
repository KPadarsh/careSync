import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { DispensingRecord, Prescription, Medicine, Notification } from "@/models";

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
    const { action, notes, items } = body;

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
      record.pharmacistName = session.user.name || "Deepak Varma, RPh";
      await record.save();

      // Update parent prescription status
      if (record.prescriptionId) {
        await Prescription.findByIdAndUpdate(record.prescriptionId, {
          status: action === "complete" ? "completed" : "dispensed",
          pharmacistNotes: `Dispensed on ${new Date().toLocaleDateString()} by ${record.pharmacistName}.`,
        });
      }

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
