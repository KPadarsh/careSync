import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requirePharmacySession } from "@/lib/auth";
import { Prescription, Medicine, DispensingRecord, Notification } from "@/models";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requirePharmacySession();
    await connectToDatabase();

    const { id } = await context.params;

    const prescription = await Prescription.findById(id)
      .populate("patientId", "name mrn gender dateOfBirth bloodGroup phone address allergies emergencyContact")
      .populate("doctorId", "name specialty department qualification roomNumber")
      .populate("dispensingRecordId")
      .lean();

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    // Check inventory availability for each medication
    const availabilityResults = await Promise.all(
      prescription.medications.map(async (med) => {
        // Find matching medicine in inventory
        // Search by first word or core brand/generic name
        const searchKeyword = med.medicine.split(" ")[0];
        const inv = await Medicine.findOne({
          $or: [
            { name: { $regex: searchKeyword, $options: "i" } },
            { genericName: { $regex: searchKeyword, $options: "i" } },
          ],
        }).lean();

        return {
          medicineName: med.medicine,
          prescribedDosage: med.dosage,
          prescribedFrequency: med.frequency,
          prescribedDuration: med.duration,
          instructions: med.instructions,
          refillsRemaining: med.refillsRemaining,
          matchedInventoryId: inv?._id?.toString() || null,
          matchedInventoryName: inv?.name || "Not Found in Catalog",
          availableQuantity: inv ? inv.availableQuantity : 0,
          unit: inv ? inv.unit : "units",
          unitPrice: inv ? inv.unitPrice : 0,
          location: inv ? inv.location : "Unassigned",
          status: inv ? inv.status : "out_of_stock",
          isAvailable: inv ? inv.availableQuantity > 0 : false,
        };
      })
    );

    const allAvailable = availabilityResults.every((item) => item.isAvailable);

    return NextResponse.json({
      success: true,
      prescription,
      availability: availabilityResults,
      allAvailable,
    });
  } catch (error: any) {
    console.error("Pharmacy prescription GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch prescription details" },
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

    // CRITICAL SECURITY & COMPLIANCE GUARD:
    // Pharmacist cannot modify doctor's prescription (medicine, dosage, frequency, duration)
    if (
      body.medications !== undefined ||
      body.medicine !== undefined ||
      body.dosage !== undefined ||
      body.frequency !== undefined ||
      body.duration !== undefined ||
      body.doctorId !== undefined ||
      body.patientId !== undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Forbidden: Pharmacists cannot modify physician prescription items (medicine, dosage, frequency, duration are legally protected). Request clarification from prescribing physician if adjustments are necessary.",
        },
        { status: 403 }
      );
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 }
      );
    }

    const { action, pharmacistNotes, clarificationReason } = body;

    if (action === "review") {
      prescription.status = "reviewed";
      prescription.pharmacistNotes = pharmacistNotes || prescription.pharmacistNotes || "Prescription reviewed by pharmacist.";
      prescription.reviewedBy = session.user._id as any;
      prescription.reviewedAt = new Date();
      await prescription.save();

      return NextResponse.json({
        success: true,
        message: "Prescription successfully reviewed and verified.",
        prescription,
      });
    }

    if (action === "check_availability") {
      // Check if all medicines are available in inventory
      let allAvailable = true;
      for (const med of prescription.medications) {
        const searchKeyword = med.medicine.split(" ")[0];
        const inv = await Medicine.findOne({
          $or: [
            { name: { $regex: searchKeyword, $options: "i" } },
            { genericName: { $regex: searchKeyword, $options: "i" } },
          ],
        });
        if (!inv || inv.availableQuantity <= 0) {
          allAvailable = false;
        }
      }

      prescription.status = allAvailable ? "ready" : "reviewed";
      prescription.pharmacistNotes = pharmacistNotes || (allAvailable ? "Stock verified in inventory. Ready for dispensing." : "Partial stock shortage noted during check.");
      prescription.reviewedBy = session.user._id as any;
      prescription.reviewedAt = new Date();
      await prescription.save();

      return NextResponse.json({
        success: true,
        message: allAvailable
          ? "Stock verified. Prescription marked Ready for Dispensing."
          : "Stock check completed. Item shortage noted.",
        isReady: allAvailable,
        prescription,
      });
    }

    if (action === "start_dispensing") {
      // Transition to dispensing state and create or reuse DispensingRecord
      prescription.status = "dispensing";
      prescription.pharmacistNotes = pharmacistNotes || "Dispensing preparation started at counter.";
      
      let dispensingRecord: any = null;
      if (prescription.dispensingRecordId) {
        dispensingRecord = await DispensingRecord.findById(prescription.dispensingRecordId);
      }

      if (!dispensingRecord) {
        const dispenseCount = await DispensingRecord.countDocuments();
        const dispenseId = `DSP-${new Date().getFullYear()}-${String(dispenseCount + 43).padStart(5, "0")}`;

        // Map items
        const items = await Promise.all(
          prescription.medications.map(async (m) => {
            const searchKeyword = m.medicine.split(" ")[0];
            const inv = await Medicine.findOne({
              $or: [
                { name: { $regex: searchKeyword, $options: "i" } },
                { genericName: { $regex: searchKeyword, $options: "i" } },
              ],
            });
            // Calculate a recommended default quantity based on frequency/duration (e.g. 7 days TID = 21)
            let defaultQty = 10;
            if (m.duration.includes("7 days")) defaultQty = m.frequency.includes("TID") ? 21 : 14;
            else if (m.duration.includes("30 days")) defaultQty = m.frequency.includes("BID") ? 60 : 30;
            else if (m.duration.includes("14 days")) defaultQty = 14;
            else if (m.duration.includes("5 days")) defaultQty = 10;

            return {
              medicineId: inv?._id,
              medicineName: m.medicine,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              quantityDispensed: defaultQty,
              unit: inv?.unit || "tablets",
              instructions: m.instructions,
              batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
            };
          })
        );

        dispensingRecord = await DispensingRecord.create({
          dispenseId,
          prescriptionId: prescription._id,
          patientId: prescription.patientId,
          doctorId: prescription.doctorId,
          pharmacistId: session.user._id,
          pharmacistName: session.user.name || "Deepak Varma, RPh",
          items,
          dispensedDate: new Date(),
          status: "preparing",
          notes: pharmacistNotes || "Prepared for patient pickup.",
        });

        prescription.dispensingRecordId = dispensingRecord._id as any;
      }

      await prescription.save();

      return NextResponse.json({
        success: true,
        message: "Dispensing workflow initiated.",
        prescription,
        dispensingRecordId: dispensingRecord._id,
      });
    }

    if (action === "request_clarification") {
      if (!clarificationReason || clarificationReason.trim().length === 0) {
        return NextResponse.json(
          { error: "Clarification reason is required" },
          { status: 400 }
        );
      }

      prescription.status = "clarification_requested";
      prescription.clarificationReason = clarificationReason.trim();
      prescription.pharmacistNotes = pharmacistNotes || `Clarification requested: ${clarificationReason.trim()}`;
      await prescription.save();

      // Create notification to prescribing doctor
      const prescribingDoc = await Prescription.findById(prescription._id).populate("doctorId");
      if (prescribingDoc?.doctorId) {
        await Notification.create({
          recipientId: (prescribingDoc.doctorId as any).userId || (prescribingDoc.doctorId as any)._id,
          title: "Pharmacy Clarification Requested",
          message: `Pharmacist requested clarification on prescription for patient: ${clarificationReason.trim()}`,
          type: "prescription",
          link: `/doctor/dashboard`,
          isRead: false,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Clarification request sent to prescribing physician.",
        prescription,
      });
    }

    // Default note update
    if (pharmacistNotes) {
      prescription.pharmacistNotes = pharmacistNotes;
      await prescription.save();
      return NextResponse.json({
        success: true,
        message: "Pharmacist notes updated.",
        prescription,
      });
    }

    return NextResponse.json(
      { error: "No valid action specified." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Pharmacy prescription PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update prescription" },
      { status: error.message === "UNAUTHORIZED_PHARMACY" ? 401 : 500 }
    );
  }
}
