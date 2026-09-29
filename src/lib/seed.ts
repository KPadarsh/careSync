import { connectToDatabase } from "@/lib/db";
import {
  User,
  Doctor,
  Patient,
  Appointment,
  Visit,
  Prescription,
  LabReport,
  MedicalRecord,
  FollowUp,
  Notification,
  Queue,
  NursingAssessment,
  NurseTask,
  LabSample,
  Medicine,
  DispensingRecord,
  Invoice,
  Payment,
  Department,
  Staff,
  Schedule,
  AuditLog,
} from "@/models";
import { hashPassword } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

export async function seedCareSyncDatabase() {
  await connectToDatabase();

  // 1. Seed Doctors if none exist
  const doctorCount = await Doctor.countDocuments();
  if (doctorCount === 0) {
    console.log("Seeding doctors...");
    await Doctor.create([
      {
        name: "Dr. Anjali Menon",
        specialty: "General Medicine",
        department: "General Medicine",
        qualification: "MD (Internal Medicine), MBBS",
        roomNumber: "Consultation Room 302, Main Clinic",
        avatar:
          "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
        availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        workingHours: { start: "09:00 AM", end: "05:00 PM" },
        slotDurationMinutes: 30,
        status: "active",
      },
      {
        name: "Dr. Rajesh Kumar",
        specialty: "Cardiology",
        department: "Cardiology",
        qualification: "MD, DM (Cardiology), FACC",
        roomNumber: "Cardiology Wing, Room 405",
        avatar:
          "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
        availableDays: ["Monday", "Wednesday", "Friday"],
        workingHours: { start: "10:00 AM", end: "04:00 PM" },
        slotDurationMinutes: 30,
        status: "active",
      },
      {
        name: "Dr. Priya Nair",
        specialty: "Pediatrics",
        department: "Pediatrics",
        qualification: "MD (Pediatrics), DCH",
        roomNumber: "Pediatric Clinic, Room 201",
        avatar:
          "https://images.unsplash.com/photo-1594824813689-53b65287f329?auto=format&fit=crop&w=300&q=80",
        availableDays: ["Tuesday", "Thursday", "Saturday"],
        workingHours: { start: "09:30 AM", end: "03:30 PM" },
        slotDurationMinutes: 30,
        status: "active",
      },
      {
        name: "Dr. Vikram Rao",
        specialty: "Orthopedics",
        department: "Orthopedics",
        qualification: "MS (Orthopedics), MCh Orth",
        roomNumber: "Surgical Suite 310",
        avatar:
          "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80",
        availableDays: ["Monday", "Tuesday", "Thursday"],
        workingHours: { start: "10:00 AM", end: "05:00 PM" },
        slotDurationMinutes: 45,
        status: "active",
      },
      {
        name: "Dr. Sunita Patil",
        specialty: "Dermatology",
        department: "Dermatology",
        qualification: "MD (Dermatology, Venereology & Leprosy)",
        roomNumber: "Derma Suite 208",
        avatar:
          "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
        availableDays: ["Wednesday", "Friday", "Saturday"],
        workingHours: { start: "09:00 AM", end: "01:00 PM" },
        slotDurationMinutes: 30,
        status: "active",
      },
    ]);
  }

  const doctors = await Doctor.find({});
  const drAnjali = doctors.find((d) => d.name.includes("Anjali")) || doctors[0];
  const drRajesh = doctors.find((d) => d.name.includes("Rajesh")) || doctors[1];

  // 2. Seed Default Patient User if not exists
  let patientUser = await User.findOne({ email: "rahul@patient.caresync.com" });
  if (!patientUser) {
    console.log("Seeding patient user...");
    patientUser = await User.create({
      name: "Rahul K.",
      email: "rahul@patient.caresync.com",
      passwordHash: hashPassword("Password123!"),
      role: ROLES.PATIENT,
      phone: "+1 (555) 234-5678",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      status: "active",
    });
  }

  // 3. Seed Patient Profile
  let patientRecord = await Patient.findOne({ userId: patientUser._id });
  if (!patientRecord) {
    console.log("Seeding patient clinical profile...");
    patientRecord = await Patient.create({
      userId: patientUser._id,
      mrn: "MRN-2026-0042",
      dateOfBirth: new Date("1991-08-15"),
      gender: "male",
      bloodGroup: "O+",
      phone: "+1 (555) 234-5678",
      address: {
        street: "742 Evergreen Terrace",
        city: "Springfield",
        state: "OR",
        postalCode: "97477",
      },
      emergencyContact: {
        name: "Pooja K.",
        relationship: "Spouse",
        phone: "+1 (555) 987-6543",
      },
      insurance: {
        provider: "Blue Cross Premium Health",
        policyNumber: "BC-98234-X",
        groupNumber: "GRP-00449",
        expiryDate: "Dec 31, 2026",
      },
      allergies: ["Penicillin", "Peanuts"],
      primaryDoctorId: drAnjali._id,
    });
  }

  // 4. Seed Appointments if none exist for this patient
  const apptCount = await Appointment.countDocuments({
    patientId: patientRecord._id,
  });
  if (apptCount === 0) {
    console.log("Seeding patient appointments...");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);

    const pastDate = new Date("2023-08-15");

    await Appointment.create([
      {
        patientId: patientRecord._id,
        doctorId: drAnjali._id,
        date: tomorrow,
        timeSlot: "10:30 AM",
        type: "in-person",
        reason: "General health review & blood pressure checkup",
        status: "confirmed",
        bookedBy: "PATIENT",
        notes: "Routine follow-up consultation with primary physician",
      },
      {
        patientId: patientRecord._id,
        doctorId: drRajesh._id,
        date: nextWeek,
        timeSlot: "02:00 PM",
        type: "in-person",
        reason: "Cardiovascular health evaluation & ECG review",
        status: "confirmed",
        bookedBy: "PATIENT",
        notes: "Preventive cardiology screening",
      },
      {
        patientId: patientRecord._id,
        doctorId: drAnjali._id,
        date: pastDate,
        timeSlot: "09:00 AM",
        type: "in-person",
        reason: "Acute seasonal allergic rhinitis",
        status: "completed",
        bookedBy: "PATIENT",
        notes: "Resolved with antihistamine course",
      },
    ]);
  }

  // 5. Seed Visits if none exist
  const visitCount = await Visit.countDocuments({ patientId: patientRecord._id });
  if (visitCount === 0) {
    console.log("Seeding patient visits...");
    await Visit.create([
      {
        patientId: patientRecord._id,
        doctorId: drAnjali._id,
        visitDate: new Date("2023-08-15"),
        reason: "Seasonal allergic rhinitis and nasal congestion",
        diagnosis: "Acute allergic upper respiratory rhinitis",
        summary:
          "Comprehensive evaluation of seasonal rhinitis symptoms. Nasal turbinates mildly inflamed. Clear lung sounds bilaterally. Antihistamine regimen prescribed. Recommended HEPA air filtration at home.",
        internalNotes: "Internal note: Patient responds well to cetirizine. Non-smoker.",
        status: "completed",
        vitals: {
          bloodPressure: "118/76",
          heartRate: 72,
          temperature: 98.4,
          oxygenSaturation: 99,
          weightKg: 74,
        },
      },
      {
        patientId: patientRecord._id,
        doctorId: drRajesh._id,
        visitDate: new Date("2023-05-10"),
        reason: "Preventative cardiac screening",
        diagnosis: "Normal sinus rhythm, borderline cholesterol profile",
        summary:
          "Resting 12-lead ECG confirmed normal sinus rhythm with no ischemic changes. Advised heart-healthy dietary adjustments and moderate daily cardiovascular exercise.",
        internalNotes: "Internal note: Family history of late-onset hypertension.",
        status: "completed",
        vitals: {
          bloodPressure: "122/80",
          heartRate: 68,
          temperature: 98.6,
          oxygenSaturation: 98,
          weightKg: 75,
        },
      },
    ]);
  }

  // 6. Seed Prescriptions if none exist
  const rxCount = await Prescription.countDocuments({
    patientId: patientRecord._id,
  });
  if (rxCount === 0) {
    console.log("Seeding patient prescriptions...");
    await Prescription.create([
      {
        patientId: patientRecord._id,
        doctorId: drAnjali._id,
        date: new Date(),
        status: "active",
        medications: [
          {
            medicine: "Amoxicillin 500mg",
            dosage: "500 mg",
            frequency: "Twice daily (Every 12 hours)",
            duration: "7 Days",
            instructions: "Take with or right after food. Complete the full 7-day course.",
            refillsRemaining: 1,
          },
          {
            medicine: "Cetirizine Hydrochloride 10mg",
            dosage: "10 mg",
            frequency: "Once daily at bedtime",
            duration: "14 Days",
            instructions: "Take with water. May cause mild sedation in evenings.",
            refillsRemaining: 2,
          },
        ],
        notes: "Prescription issued for respiratory allergy management",
      },
      {
        patientId: patientRecord._id,
        doctorId: drRajesh._id,
        date: new Date("2023-05-10"),
        status: "completed",
        medications: [
          {
            medicine: "Atorvastatin Calcium 10mg",
            dosage: "10 mg",
            frequency: "Once daily (Evening)",
            duration: "30 Days",
            instructions: "Take daily with dinner. Avoid grapefruit intake.",
            refillsRemaining: 0,
          },
        ],
        notes: "Completed course for cholesterol balance",
      },
    ]);
  }

  // 7. Seed Lab Reports if none exist
  const labCount = await LabReport.countDocuments({
    patientId: patientRecord._id,
  });
  if (labCount === 0) {
    console.log("Seeding verified lab reports...");
    await LabReport.create([
      {
        patientId: patientRecord._id,
        doctorId: drAnjali._id,
        testName: "Comprehensive Metabolic Panel (CMP)",
        department: "Biochemistry",
        sampleCollectionDate: new Date(),
        verifiedDate: new Date(),
        status: "verified",
        summary:
          "All biochemical parameters, renal indices, and hepatic markers fall within optimal physiological reference ranges.",
        verifiedBy: "Dr. Sunita Patil, MD Pathology",
        results: [
          {
            parameter: "Fasting Blood Glucose",
            value: "92",
            unit: "mg/dL",
            referenceRange: "70 - 99",
            flag: "normal",
          },
          {
            parameter: "Serum Creatinine",
            value: "0.9",
            unit: "mg/dL",
            referenceRange: "0.6 - 1.2",
            flag: "normal",
          },
          {
            parameter: "Blood Urea Nitrogen (BUN)",
            value: "14",
            unit: "mg/dL",
            referenceRange: "7 - 20",
            flag: "normal",
          },
          {
            parameter: "Estimated GFR",
            value: "104",
            unit: "mL/min/1.73m²",
            referenceRange: "> 90",
            flag: "normal",
          },
        ],
      },
      {
        patientId: patientRecord._id,
        doctorId: drAnjali._id,
        testName: "Complete Blood Count (CBC) with Differential",
        department: "Hematology",
        sampleCollectionDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        verifiedDate: new Date(Date.now() - 20 * 60 * 60 * 1000),
        status: "verified",
        summary:
          "Normal white cell and platelet counts. Adequate hemoglobin and red cell indices.",
        verifiedBy: "Dr. Sunita Patil, MD Pathology",
        results: [
          {
            parameter: "Hemoglobin",
            value: "15.2",
            unit: "g/dL",
            referenceRange: "13.8 - 17.2",
            flag: "normal",
          },
          {
            parameter: "White Blood Cells (WBC)",
            value: "6.8",
            unit: "x10³/µL",
            referenceRange: "4.5 - 11.0",
            flag: "normal",
          },
          {
            parameter: "Platelet Count",
            value: "245",
            unit: "x10³/µL",
            referenceRange: "150 - 450",
            flag: "normal",
          },
          {
            parameter: "Red Blood Cells (RBC)",
            value: "5.1",
            unit: "x10⁶/µL",
            referenceRange: "4.3 - 5.9",
            flag: "normal",
          },
        ],
      },
      {
        patientId: patientRecord._id,
        doctorId: drRajesh._id,
        testName: "Fasting Lipid Panel",
        department: "Biochemistry",
        sampleCollectionDate: new Date("2023-05-12"),
        verifiedDate: new Date("2023-05-13"),
        status: "verified",
        summary: "Cardiovascular lipid profile demonstrates favorable HDL and normal triglycerides.",
        verifiedBy: "Dr. Sunita Patil, MD Pathology",
        results: [
          {
            parameter: "Total Cholesterol",
            value: "188",
            unit: "mg/dL",
            referenceRange: "< 200",
            flag: "normal",
          },
          {
            parameter: "HDL Cholesterol",
            value: "52",
            unit: "mg/dL",
            referenceRange: "> 40",
            flag: "normal",
          },
          {
            parameter: "LDL Cholesterol",
            value: "112",
            unit: "mg/dL",
            referenceRange: "< 100",
            flag: "high",
          },
          {
            parameter: "Triglycerides",
            value: "135",
            unit: "mg/dL",
            referenceRange: "< 150",
            flag: "normal",
          },
        ],
      },
    ]);
  }

  // 8. Seed Medical Records if none exist
  const recCount = await MedicalRecord.countDocuments({
    patientId: patientRecord._id,
  });
  if (recCount === 0) {
    console.log("Seeding patient-accessible medical records...");
    await MedicalRecord.create([
      {
        patientId: patientRecord._id,
        doctorId: drAnjali._id,
        title: "Physician Clinical Consultation Summary",
        category: "consultation",
        recordDate: new Date("2023-08-15"),
        facility: "CareSync Central Clinic, Room 302",
        summary:
          "Detailed clinical evaluation regarding allergic symptoms. Vital signs confirmed stable. Assessment confirmed seasonal upper respiratory allergy. Care plan instituted.",
        isStaffOnly: false,
      },
      {
        patientId: patientRecord._id,
        doctorId: drRajesh._id,
        title: "Cardiology Preventive Screening Report",
        category: "clinical-note",
        recordDate: new Date("2023-05-10"),
        facility: "CareSync Cardiac Diagnostics Wing",
        summary:
          "Screening encounter summary including resting 12-lead ECG tracings and preventive lifestyle recommendations.",
        isStaffOnly: false,
      },
      {
        patientId: patientRecord._id,
        doctorId: drAnjali._id,
        title: "Annual Health & Wellness Clearance",
        category: "discharge-summary",
        recordDate: new Date("2023-01-20"),
        facility: "CareSync Ambulatory Care Pavilion",
        summary:
          "Annual comprehensive adult wellness examination. Full systemic review completed with satisfactory outcomes.",
        isStaffOnly: false,
      },
    ]);
  }

  // 9. Seed Follow-ups if none exist
  const fuCount = await FollowUp.countDocuments({
    patientId: patientRecord._id,
  });
  if (fuCount === 0) {
    console.log("Seeding clinical follow-up instructions...");
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    await FollowUp.create({
      patientId: patientRecord._id,
      doctorId: drAnjali._id,
      recommendedDate: twoWeeks,
      reason: "Blood Pressure & Medication Efficacy Follow-up",
      clinicalInstructions:
        "Log blood pressure twice daily for 7 consecutive days prior to visit. Take morning reading before breakfast and evening reading before sleep. Bring the written log to your appointment.",
      status: "pending",
    });
  }

  // 10. Seed Notifications if none exist
  const notifCount = await Notification.countDocuments({
    recipientId: patientUser._id,
  });
  if (notifCount === 0) {
    console.log("Seeding patient notifications...");
    await Notification.create([
      {
        recipientId: patientUser._id,
        title: "Appointment Confirmed",
        message:
          "Your appointment with Dr. Anjali Menon tomorrow at 10:30 AM is confirmed.",
        type: "appointment",
        link: "/patient/appointments",
        isRead: false,
      },
      {
        recipientId: patientUser._id,
        title: "Lab Report Verified",
        message:
          "Your Comprehensive Metabolic Panel (CMP) results have been verified by Dr. Sunita Patil.",
        type: "lab_report",
        link: "/patient/lab-reports",
        isRead: false,
      },
      {
        recipientId: patientUser._id,
        title: "Active Prescription",
        message:
          "Dr. Anjali Menon issued your prescription for Amoxicillin & Cetirizine.",
        type: "prescription",
        link: "/patient/prescriptions",
        isRead: false,
      },
      {
        recipientId: patientUser._id,
        title: "Follow-up Recommended",
        message:
          "Dr. Anjali Menon requested a 2-week follow-up for blood pressure review.",
        type: "follow_up",
        link: "/patient/follow-ups",
        isRead: true,
      },
    ]);
  }

  // 11. Seed Receptionist User if not exists
  let receptionUser = await User.findOne({ email: "sarah@reception.caresync.com" });
  if (!receptionUser) {
    console.log("Seeding receptionist user (Sarah Adams)...");
    receptionUser = await User.create({
      name: "Sarah Adams",
      email: "sarah@reception.caresync.com",
      passwordHash: hashPassword("Password123!"),
      role: ROLES.RECEPTION,
      phone: "+1 (555) 019-2834",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      status: "active",
    });
  }

  // 12. Seed Stitch Doctors if not present
  const stitchDoctorData = [
    {
      name: "Dr. Anil Kumar",
      specialty: "Cardiology",
      department: "Cardiology",
      qualification: "MD, FACC",
      roomNumber: "Room 302",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: { start: "08:30 AM", end: "04:30 PM" },
      slotDurationMinutes: 30,
      status: "active" as const,
    },
    {
      name: "Dr. Meera Thomas",
      specialty: "Pediatrics",
      department: "Pediatrics",
      qualification: "MD, FAAP",
      roomNumber: "Room 201",
      avatar: "https://images.unsplash.com/photo-1594824813689-53b65287f329?auto=format&fit=crop&w=300&q=80",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: { start: "08:30 AM", end: "04:00 PM" },
      slotDurationMinutes: 20,
      status: "active" as const,
    },
    {
      name: "Dr. Vivek Sharma",
      specialty: "Orthopedics",
      department: "Orthopedics",
      qualification: "MS Ortho, FRCS",
      roomNumber: "Room 205",
      avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=300&q=80",
      availableDays: ["Monday", "Wednesday", "Thursday", "Friday"],
      workingHours: { start: "09:00 AM", end: "05:00 PM" },
      slotDurationMinutes: 30,
      status: "active" as const,
    },
    {
      name: "Dr. Maya Patel",
      specialty: "Dermatology",
      department: "Dermatology",
      qualification: "MD Dermatology",
      roomNumber: "Room 104",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
      availableDays: ["Tuesday", "Wednesday", "Friday", "Saturday"],
      workingHours: { start: "09:00 AM", end: "02:00 PM" },
      slotDurationMinutes: 30,
      status: "active" as const,
    },
    {
      name: "Dr. Sarah Jenkins",
      specialty: "General Practice",
      department: "General Medicine",
      qualification: "MD, MRCGP",
      roomNumber: "Room 101",
      avatar: "https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=300&q=80",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      workingHours: { start: "08:00 AM", end: "03:30 PM" },
      slotDurationMinutes: 20,
      status: "active" as const,
    },
    {
      name: "Dr. Elena Rostova",
      specialty: "Orthopedics",
      department: "Orthopedics",
      qualification: "MD, PhD",
      roomNumber: "Room 205",
      avatar: "https://images.unsplash.com/photo-1594824813689-53b65287f329?auto=format&fit=crop&w=300&q=80",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday"],
      workingHours: { start: "10:00 AM", end: "04:00 PM" },
      slotDurationMinutes: 30,
      status: "active" as const,
    },
    {
      name: "Dr. David Kim",
      specialty: "Pediatrics",
      department: "Pediatrics",
      qualification: "MD, FAAP",
      roomNumber: "Room 102",
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
      availableDays: ["Monday", "Wednesday", "Friday"],
      workingHours: { start: "09:00 AM", end: "05:00 PM" },
      slotDurationMinutes: 30,
      status: "active" as const,
    },
  ];

  for (const doc of stitchDoctorData) {
    const existing = await Doctor.findOne({ name: doc.name });
    if (!existing) {
      await Doctor.create(doc);
    }
  }

  // 13. Seed Stitch Patients
  const stitchPatients = [
    {
      name: "Rahul Menon",
      email: "rahul@patient.caresync.com",
      mrn: "MRN-84920",
      dob: "1991-08-15",
      gender: "male" as const,
      bloodGroup: "O+" as const,
      phone: "+1 (555) 234-5678",
      street: "742 Evergreen Terrace",
      city: "Springfield",
      state: "OR",
      zip: "97477",
      allergies: ["Penicillin", "Peanuts"],
      emergencyName: "Pooja Menon",
      emergencyRel: "Spouse",
      emergencyPhone: "+1 (555) 987-6543",
      insuranceProv: "Blue Cross Premium Health",
      insurancePol: "BC-98234-X",
    },
    {
      name: "Anitha Raj",
      email: "anitha.raj@example.com",
      mrn: "MRN-84921",
      dob: "1997-03-22",
      gender: "female" as const,
      bloodGroup: "B+" as const,
      phone: "+1 (555) 345-6789",
      street: "128 Oakridge Ave",
      city: "Portland",
      state: "OR",
      zip: "97201",
      allergies: ["Sulfa drugs"],
      emergencyName: "Karthik Raj",
      emergencyRel: "Brother",
      emergencyPhone: "+1 (555) 887-2234",
      insuranceProv: "Aetna Health",
      insurancePol: "AET-77291-C",
    },
    {
      name: "Samuel John",
      email: "samuel.j@example.com",
      mrn: "MRN-84922",
      dob: "1980-11-04",
      gender: "male" as const,
      bloodGroup: "A+" as const,
      phone: "+1 (555) 456-7890",
      street: "450 Willow Creek Rd",
      city: "Beaverton",
      state: "OR",
      zip: "97005",
      allergies: ["Aspirin", "Ibuprofen"],
      emergencyName: "Mary John",
      emergencyRel: "Wife",
      emergencyPhone: "+1 (555) 667-8891",
      insuranceProv: "UnitedHealthcare",
      insurancePol: "UHC-55412-K",
    },
    {
      name: "Priya Sharma",
      email: "priya.s@example.com",
      mrn: "MRN-84923",
      dob: "1994-06-18",
      gender: "female" as const,
      bloodGroup: "AB+" as const,
      phone: "+1 (555) 567-8901",
      street: "89 Pine Crest Way",
      city: "Eugene",
      state: "OR",
      zip: "97401",
      allergies: [],
      emergencyName: "Sunil Sharma",
      emergencyRel: "Father",
      emergencyPhone: "+1 (555) 998-1123",
      insuranceProv: "Cigna Health Care",
      insurancePol: "CIG-33290-P",
    },
    {
      name: "Marcus Chen",
      email: "marcus.c@example.com",
      mrn: "MRN-84924",
      dob: "1973-09-12",
      gender: "male" as const,
      bloodGroup: "O-" as const,
      phone: "+1 (555) 678-9012",
      street: "312 Cedar Grove St",
      city: "Salem",
      state: "OR",
      zip: "97301",
      allergies: ["Latex"],
      emergencyName: "Helen Chen",
      emergencyRel: "Daughter",
      emergencyPhone: "+1 (555) 441-2299",
      insuranceProv: "Kaiser Permanente",
      insurancePol: "KP-11984-Z",
    },
    {
      name: "David Miller",
      email: "david.m@example.com",
      mrn: "MRN-84925",
      dob: "1964-04-03",
      gender: "male" as const,
      bloodGroup: "A-" as const,
      phone: "+1 (555) 789-0123",
      street: "560 Lakeview Drive",
      city: "Bend",
      state: "OR",
      zip: "97701",
      allergies: ["Codeine"],
      emergencyName: "Patricia Miller",
      emergencyRel: "Spouse",
      emergencyPhone: "+1 (555) 332-9988",
      insuranceProv: "Blue Cross Shield",
      insurancePol: "BC-44910-M",
    },
    {
      name: "Fatima Zahra",
      email: "fatima.z@example.com",
      mrn: "MRN-84926",
      dob: "2001-12-28",
      gender: "female" as const,
      bloodGroup: "B-" as const,
      phone: "+1 (555) 890-1234",
      street: "19 Meadow Brook Lane",
      city: "Hillsboro",
      state: "OR",
      zip: "97124",
      allergies: [],
      emergencyName: "Amina Zahra",
      emergencyRel: "Mother",
      emergencyPhone: "+1 (555) 774-6632",
      insuranceProv: "Providence Health",
      insurancePol: "PRV-88204-Q",
    },
    {
      name: "Rohan Gupta",
      email: "rohan.g@example.com",
      mrn: "MRN-84927",
      dob: "1986-07-19",
      gender: "male" as const,
      bloodGroup: "O+" as const,
      phone: "+1 (555) 901-2345",
      street: "704 Riverfront Plaza",
      city: "Corvallis",
      state: "OR",
      zip: "97330",
      allergies: ["Amoxicillin"],
      emergencyName: "Nisha Gupta",
      emergencyRel: "Spouse",
      emergencyPhone: "+1 (555) 223-9944",
      insuranceProv: "Regence BlueShield",
      insurancePol: "REG-66301-T",
    },
  ];

  for (const p of stitchPatients) {
    let u = await User.findOne({ email: p.email });
    if (!u) {
      u = await User.create({
        name: p.name,
        email: p.email,
        passwordHash: hashPassword("Password123!"),
        role: ROLES.PATIENT,
        phone: p.phone,
        status: "active",
      });
    }
    const existingPat = await Patient.findOne({
      $or: [{ mrn: p.mrn }, { userId: u._id }],
    });
    if (!existingPat) {
      await Patient.create({
        userId: u._id,
        mrn: p.mrn,
        dateOfBirth: new Date(p.dob),
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        phone: p.phone,
        address: {
          street: p.street,
          city: p.city,
          state: p.state,
          postalCode: p.zip,
        },
        emergencyContact: {
          name: p.emergencyName,
          relationship: p.emergencyRel,
          phone: p.emergencyPhone,
        },
        insurance: {
          provider: p.insuranceProv,
          policyNumber: p.insurancePol,
          groupNumber: "GRP-0912",
          expiryDate: "2027-12-31",
        },
        allergies: p.allergies,
      });
    }
  }

  // 14. Seed Today's Appointments & Queue
  const allDocs = await Doctor.find({});
  const docAnil = allDocs.find((d) => d.name.includes("Anil")) || allDocs[0];
  const docMeera = allDocs.find((d) => d.name.includes("Meera")) || allDocs[1] || allDocs[0];
  const docVivek = allDocs.find((d) => d.name.includes("Vivek")) || allDocs[2] || allDocs[0];
  const docMaya = allDocs.find((d) => d.name.includes("Maya")) || allDocs[3] || allDocs[0];
  const docSarah = allDocs.find((d) => d.name.includes("Sarah")) || allDocs[4] || allDocs[0];

  const patRahul = (await Patient.findOne({ mrn: "MRN-84920" })) || patientRecord;
  const patAnitha = await Patient.findOne({ mrn: "MRN-84921" });
  const patSamuel = await Patient.findOne({ mrn: "MRN-84922" });
  const patPriya = await Patient.findOne({ mrn: "MRN-84923" });
  const patMarcus = await Patient.findOne({ mrn: "MRN-84924" });
  const patDavid = await Patient.findOne({ mrn: "MRN-84925" });
  const patFatima = await Patient.findOne({ mrn: "MRN-84926" });
  const patRohan = await Patient.findOne({ mrn: "MRN-84927" });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today's appointments exist
  const todayApptCount = await Appointment.countDocuments({
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
  });

  let apptMarcus, apptAnitha, apptRahul, apptSamuel, apptPriya;

  if (todayApptCount === 0 && patRahul && patAnitha && patSamuel && patPriya && patMarcus) {
    console.log("Seeding today's clinic appointments...");
    const appts: any = await Appointment.insertMany([
      {
        patientId: patMarcus._id,
        doctorId: docAnil._id,
        date: today,
        timeSlot: "08:30 AM",
        type: "in-person",
        reason: "Cardiac Follow-up & Hypertension Medication Review",
        status: "checked-in",
        bookedBy: "RECEPTIONIST",
      },
      {
        patientId: patAnitha._id,
        doctorId: docMeera._id,
        date: today,
        timeSlot: "09:00 AM",
        type: "in-person",
        reason: "Pediatric Wellness & Vaccination Follow-up",
        status: "checked-in",
        bookedBy: "RECEPTIONIST",
      },
      {
        patientId: patRahul._id,
        doctorId: docAnil._id,
        date: today,
        timeSlot: "09:30 AM",
        type: "in-person",
        reason: "Quarterly Cardiology Check & BP Evaluation",
        status: "checked-in",
        bookedBy: "RECEPTIONIST",
      },
      {
        patientId: patSamuel._id,
        doctorId: docVivek._id,
        date: today,
        timeSlot: "10:00 AM",
        type: "in-person",
        reason: "Post-op Knee Dressing Change & Mobility Assessment",
        status: "checked-in",
        bookedBy: "RECEPTIONIST",
      },
      {
        patientId: patPriya._id,
        doctorId: docMaya._id,
        date: today,
        timeSlot: "10:30 AM",
        type: "in-person",
        reason: "Dermatitis Flare-up & Rash Evaluation",
        status: "checked-in",
        bookedBy: "RECEPTIONIST",
      },
      {
        patientId: patDavid?._id || patRahul!._id,
        doctorId: docSarah._id,
        date: today,
        timeSlot: "11:15 AM",
        type: "in-person",
        reason: "Seasonal Allergy & Respiratory Consultation",
        status: "confirmed",
        bookedBy: "PATIENT",
      },
      {
        patientId: patFatima?._id || patAnitha._id,
        doctorId: docMeera._id,
        date: today,
        timeSlot: "02:00 PM",
        type: "in-person",
        reason: "Routine Child Growth Milestone Checkup",
        status: "confirmed",
        bookedBy: "PATIENT",
      },
      {
        patientId: patRohan?._id || patRahul!._id,
        doctorId: docVivek._id,
        date: today,
        timeSlot: "03:30 PM",
        type: "in-person",
        reason: "Lower Lumbar Pain Review",
        status: "scheduled",
        bookedBy: "PATIENT",
      },
    ]);

    apptMarcus = appts[0];
    apptAnitha = appts[1];
    apptRahul = appts[2];
    apptSamuel = appts[3];
    apptPriya = appts[4];
  } else {
    apptMarcus = await Appointment.findOne({ patientId: patMarcus?._id });
    apptAnitha = await Appointment.findOne({ patientId: patAnitha?._id });
    apptRahul = await Appointment.findOne({ patientId: patRahul?._id });
    apptSamuel = await Appointment.findOne({ patientId: patSamuel?._id });
    apptPriya = await Appointment.findOne({ patientId: patPriya?._id });
  }

  // 15. Seed Live Queue if empty
  const { Queue } = await import("@/models/Queue");
  const queueCount = await Queue.countDocuments();
  if (queueCount === 0 && patMarcus && patAnitha && patRahul && patSamuel && patPriya) {
    console.log("Seeding clinic queue entries...");
    await Queue.create([
      {
        ticketNumber: "Q-019",
        patientId: patMarcus._id,
        doctorId: docAnil._id,
        appointmentId: apptMarcus?._id,
        department: "Cardiology",
        roomNumber: "Room 302",
        status: "called",
        priority: "normal",
        source: "appointment",
        checkedInTime: new Date(Date.now() - 45 * 60 * 1000),
        calledTime: new Date(Date.now() - 5 * 60 * 1000),
        notes: "Called to Room 302 by Dr. Anil Kumar",
      },
      {
        ticketNumber: "Q-020",
        patientId: patAnitha._id,
        doctorId: docMeera._id,
        appointmentId: apptAnitha?._id,
        department: "Pediatrics",
        roomNumber: "Room 201",
        status: "in-consultation",
        priority: "urgent",
        source: "appointment",
        checkedInTime: new Date(Date.now() - 38 * 60 * 1000),
        calledTime: new Date(Date.now() - 20 * 60 * 1000),
        notes: "High fever child accompanied by mother",
      },
      {
        ticketNumber: "Q-021",
        patientId: patRahul._id,
        doctorId: docAnil._id,
        appointmentId: apptRahul?._id,
        department: "Cardiology",
        roomNumber: "Room 302",
        status: "waiting",
        priority: "normal",
        source: "appointment",
        checkedInTime: new Date(Date.now() - 30 * 60 * 1000),
        notes: "Routine follow-up, BP log attached",
      },
      {
        ticketNumber: "Q-022",
        patientId: patSamuel._id,
        doctorId: docVivek._id,
        appointmentId: apptSamuel?._id,
        department: "Orthopedics",
        roomNumber: "Room 205",
        status: "waiting",
        priority: "urgent",
        source: "walk-in",
        checkedInTime: new Date(Date.now() - 15 * 60 * 1000),
        notes: "Urgent dressing check; acute knee swelling",
      },
      {
        ticketNumber: "Q-023",
        patientId: patPriya._id,
        doctorId: docMaya._id,
        appointmentId: apptPriya?._id,
        department: "Dermatology",
        roomNumber: "Room 104",
        status: "waiting",
        priority: "normal",
        source: "appointment",
        checkedInTime: new Date(Date.now() - 8 * 60 * 1000),
        notes: "Arrived on time for rash exam",
      },
    ]);
  }

  // 16. Seed Follow-ups for Reception Portal
  const totalFollowups = await FollowUp.countDocuments();
  if (totalFollowups <= 1 && patSamuel && patMarcus && patAnitha) {
    console.log("Seeding reception follow-up items...");
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await FollowUp.create([
      {
        patientId: patSamuel._id,
        doctorId: docVivek._id,
        recommendedDate: today,
        reason: "Post-op Knee Dressing Change & Suture Removal",
        clinicalInstructions: "Inspect surgical site on right knee. Remove sutures if wound healing is satisfactory and signs of infection are absent.",
        status: "pending",
      },
      {
        patientId: patMarcus._id,
        doctorId: docAnil._id,
        recommendedDate: today,
        reason: "Hypertension Medication Titration Review",
        clinicalInstructions: "Check ambulatory blood pressure logs. Assess adherence to Lisinopril 20mg daily.",
        status: "pending",
      },
      {
        patientId: patAnitha._id,
        doctorId: docMeera._id,
        recommendedDate: inThreeDays,
        reason: "Pediatric Immunization Booster & Allergy Check",
        clinicalInstructions: "Administer second booster dose. Verify no delayed hypersensitivity reaction from prior dose.",
        status: "pending",
      },
      {
        patientId: patDavid?._id || patRahul!._id,
        doctorId: docAnil._id,
        recommendedDate: twoDaysAgo,
        reason: "Cardiac Stress Test & Lipid Panel Follow-up",
        clinicalInstructions: "Review treadmill Bruce protocol results and discuss statin therapy optimization.",
        status: "pending",
      },
    ]);
  }

  // 17. Seed Receptionist Notifications
  const receptionNotifCount = await Notification.countDocuments({
    recipientId: receptionUser._id,
  });
  if (receptionNotifCount === 0) {
    console.log("Seeding receptionist notifications...");
    await Notification.create([
      {
        recipientId: receptionUser._id,
        title: "Room 205 Running 20 Mins Behind",
        message: "Dr. Vivek Sharma has an extended orthopedic consultation. Please alert waiting patients in Room 205 queue.",
        type: "system",
        link: "/reception/queue",
        isRead: false,
      },
      {
        recipientId: receptionUser._id,
        title: "Walk-in Surge Standby Alert",
        message: "Pediatrics (Room 201) has reached 85% capacity. Advise non-urgent walk-ins about possible 45-min wait times.",
        type: "system",
        link: "/reception/walk-ins",
        isRead: false,
      },
      {
        recipientId: receptionUser._id,
        title: "New Follow-up Task Assigned",
        message: "Dr. Anil Kumar marked Samuel John for priority dressing change follow-up today.",
        type: "follow_up",
        link: "/reception/follow-ups",
        isRead: false,
      },
      {
        recipientId: receptionUser._id,
        title: "Patient Check-in Confirmed",
        message: "Marcus Chen (MRN-84924) checked in for 08:30 AM appointment with Dr. Anil Kumar.",
        type: "appointment",
        link: "/reception/queue",
        isRead: true,
      },
    ]);
  }

  // 17. Seed Nurse User (Arun Mary) if not exists
  let nurseUser = await User.findOne({ email: "arun.mary@nurse.caresync.com" });
  if (!nurseUser) {
    console.log("Seeding nurse user (Arun Mary)...");
    nurseUser = await User.create({
      name: "Arun Mary",
      email: "arun.mary@nurse.caresync.com",
      passwordHash: hashPassword("Password123!"),
      role: ROLES.NURSE,
      phone: "+1 (555) 018-4721",
      avatar: "https://images.unsplash.com/photo-1594824813689-53b65287f329?auto=format&fit=crop&w=200&q=80",
      status: "active",
    });
  }

  // 18. Seed Nurse Tasks if none exist
  const taskCount = await NurseTask.countDocuments();
  if (taskCount === 0) {
    console.log("Seeding initial nurse tasks...");
    const samplePatients = await Patient.find({}).populate("userId", "name").limit(5);
    const p1 = samplePatients[0];
    const p2 = samplePatients[1] || p1;
    const p3 = samplePatients[2] || p1;
    const p4 = samplePatients[3] || p1;

    const getName = (pat: any, fallback: string) => {
      if (!pat) return fallback;
      if (pat.firstName && pat.lastName) return `${pat.firstName} ${pat.lastName}`;
      if (pat.userId?.name) return pat.userId.name;
      return fallback;
    };

    await NurseTask.create([
      {
        title: "Administer Oral Analgesic (Acetaminophen 500mg)",
        description: "Patient reported acute headache following vitals triage. Confirm allergy history before dispensing.",
        patientId: p1?._id,
        patientName: getName(p1, "Marcus Chen"),
        nurseId: nurseUser._id,
        nurseName: "Arun Mary, RN",
        roomNumber: "Room 302",
        dueTime: "10:30 AM",
        priority: "normal",
        status: "pending",
        category: "medication",
      },
      {
        title: "Stat 12-Lead ECG Triage Check",
        description: "Elevated heart rate (104 bpm) and mild tightness on exertion noted. Verify lead placement.",
        patientId: p2?._id,
        patientName: getName(p2, "Priya Sharma"),
        nurseId: nurseUser._id,
        nurseName: "Arun Mary, RN",
        roomNumber: "Room 302",
        dueTime: "10:45 AM",
        priority: "urgent",
        status: "pending",
        category: "vitals",
      },
      {
        title: "Post-op Dressing Inspection & Change",
        description: "Assess surgical wound dressing integrity, check for erythema or discharge.",
        patientId: p3?._id,
        patientName: getName(p3, "David Miller"),
        nurseId: nurseUser._id,
        nurseName: "Arun Mary, RN",
        roomNumber: "Room 205",
        dueTime: "11:15 AM",
        priority: "normal",
        status: "pending",
        category: "wound-care",
      },
      {
        title: "Doctor Handoff Briefing with Dr. Anil Kumar",
        description: "Review morning intake cohort and hand off priority patient triage charts.",
        patientId: p4?._id,
        patientName: getName(p4, "James Wilson"),
        nurseId: nurseUser._id,
        nurseName: "Arun Mary, RN",
        roomNumber: "Station 3A",
        dueTime: "11:30 AM",
        priority: "normal",
        status: "completed",
        category: "handoff",
        completedAt: new Date(),
      },
      {
        title: "Confirm Lab Specimen Collection for Lipid Panel",
        description: "Ensure fasting blood sample tube is labeled with barcode MRN-84924 and sent to pathology.",
        patientId: p1?._id,
        patientName: getName(p1, "Marcus Chen"),
        nurseId: nurseUser._id,
        nurseName: "Arun Mary, RN",
        roomNumber: "Room 302",
        dueTime: "12:00 PM",
        priority: "normal",
        status: "pending",
        category: "general",
      },
    ]);
  }

  // 19. Seed Initial Nursing Assessments if none exist
  const assessmentCount = await NursingAssessment.countDocuments();
  if (assessmentCount === 0) {
    console.log("Seeding initial nursing assessments...");
    const allPatients = await Patient.find({}).limit(5);
    const drAnil = await Doctor.findOne({ name: /Anil/i }) || doctors[0];

    for (let i = 0; i < allPatients.length; i++) {
      const pat = allPatients[i];
      const isUrgent = i === 1;
      const isDraft = i === 0;

      await NursingAssessment.create({
        patientId: pat._id,
        nurseId: nurseUser._id,
        nurseName: "Arun Mary, RN",
        doctorId: drAnil?._id,
        vitals: {
          bloodPressure: isUrgent ? "142/92" : "120/80",
          systolic: isUrgent ? 142 : 120,
          diastolic: isUrgent ? 92 : 80,
          heartRate: isUrgent ? 104 : 76,
          oxygenSaturation: isUrgent ? 96 : 99,
          temperature: isUrgent ? 99.1 : 98.6,
          respiratoryRate: isUrgent ? 20 : 16,
          weightKg: 72 + i * 3,
          heightCm: 172 + (i % 3) * 4,
          bmi: 24.3,
          painScore: isUrgent ? 6 : 2,
          recordedAt: new Date(Date.now() - (i + 1) * 3600000),
          notes: isUrgent ? "Elevated pulse and blood pressure; reported chest tightness." : "Normal vitals profile.",
        },
        chiefComplaint: isUrgent
          ? "Chest tightness and palpitations after exertion"
          : "Routine triage checkup and follow-up consultation",
        symptoms: isUrgent
          ? ["Chest tightness", "Mild shortness of breath", "Fatigue"]
          : ["Occasional joint stiffness"],
        painLocation: isUrgent ? "Mid-sternal" : "Right knee",
        painCharacteristics: isUrgent ? "Dull pressure, non-radiating" : "Intermittent ache on movement",
        observations: isUrgent
          ? "Patient appears mildly anxious, skin warm and dry. Regular heart sounds, tachypneic on movement."
          : "Alert, fully oriented x 4. Comfortable in seated position.",
        condition: isUrgent ? "needs-monitoring" : "stable",
        mobility: isUrgent ? "assisted" : "independent",
        triagePriority: isUrgent ? "urgent" : "normal",
        doctorHandoffNotes: isUrgent
          ? "Flagged for priority ECG and Dr. Anil Kumar evaluation upon room entry."
          : "Vitals stable, patient seated in waiting sub-lounge.",
        generalNotes: "Patient briefed on triage workflow.",
        status: isDraft ? "draft" : "completed",
        completedAt: isDraft ? undefined : new Date(Date.now() - (i + 1) * 3600000),
      });
    }
  }

  // 20. Seed Nurse Notifications if none exist
  const nurseNotifCount = await Notification.countDocuments({ recipientId: nurseUser._id });
  if (nurseNotifCount === 0) {
    console.log("Seeding nurse notifications...");
    await Notification.create([
      {
        recipientId: nurseUser._id,
        title: "Triage Alert: Elevated Vitals in Room 302",
        message: "Priya Sharma recorded BP 142/92 and HR 104 bpm. Protocol ECG recommended prior to doctor consultation.",
        type: "system",
        link: "/nurse/queue",
        isRead: false,
      },
      {
        recipientId: nurseUser._id,
        title: "New Patient Checked In - Waiting for Vitals",
        message: "Reception checked in Marcus Chen for Dr. Anil Kumar. Patient waiting in triage bay.",
        type: "appointment",
        link: "/nurse/queue",
        isRead: false,
      },
      {
        recipientId: nurseUser._id,
        title: "Medication Administration Window Due",
        message: "Oral Analgesic due at 10:30 AM for Marcus Chen (Room 302).",
        type: "system",
        link: "/nurse/tasks",
        isRead: true,
      },
      {
        recipientId: nurseUser._id,
        title: "Doctor Consultation Completed",
        message: "Dr. Anil Kumar completed consultation for James Wilson. Nursing handoff record archived.",
        type: "system",
        link: "/nurse/records",
        isRead: true,
      },
    ]);
  }

  // 21. Seed Doctor User (Dr. Anil Kumar) if not exists
  let doctorUser = await User.findOne({ email: "anil@doctor.caresync.com" });
  if (!doctorUser) {
    console.log("Seeding doctor user (Dr. Anil Kumar)...");
    doctorUser = await User.create({
      name: "Dr. Anil Kumar",
      email: "anil@doctor.caresync.com",
      passwordHash: hashPassword("Password123!"),
      role: ROLES.DOCTOR,
      phone: "+1 (555) 018-4921",
      avatar:
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
      status: "active",
    });
  }

  // Link Doctor document to doctor user
  const doctorDocAnil = await Doctor.findOne({ name: /Anil/i });
  if (doctorDocAnil && !doctorDocAnil.userId) {
    doctorDocAnil.userId = doctorUser._id as any;
    await doctorDocAnil.save();
  }

  // 22. Seed Doctor Notifications if none exist
  const doctorNotifCount = await Notification.countDocuments({
    recipientId: doctorUser._id,
  });
  if (doctorNotifCount === 0) {
    console.log("Seeding doctor notifications...");
    await Notification.insertMany([
      {
        recipientId: doctorUser._id,
        title: "Verified Pathology Report: Rahul Verma",
        message:
          "Automated Pathology Sync: Serum Troponin I and Lipid Panel results verified by Dr. Sunita Patil.",
        type: "lab_report",
        link: "/doctor/lab",
        isRead: false,
      },
      {
        recipientId: doctorUser._id,
        title: "Triage Alert: Elevated Blood Pressure in Station 4",
        message:
          "Nurse Arun Mary flagged patient Sara Thomas with BP 142/92. Immediate doctor evaluation requested.",
        type: "system",
        link: "/doctor/queue",
        isRead: false,
      },
      {
        recipientId: doctorUser._id,
        title: "Patient Ready for Consultation",
        message:
          "Nurse triage completed for Rahul Verma (CF-2026-00125). Patient transferred to Room 302 exam lounge.",
        type: "appointment",
        link: "/doctor/queue",
        isRead: true,
      },
      {
        recipientId: doctorUser._id,
        title: "Follow-up Scheduled by Reception",
        message:
          "Sarah Adams scheduled follow-up appointment for Marcus Chen for next Tuesday at 10:00 AM.",
        type: "follow_up",
        link: "/doctor/follow-ups",
        isRead: true,
      },
    ]);
  }

  // 23. Ensure Doctor Queue has Ready-for-Doctor & In-Consultation items
  if (docAnil) {
    const readyCount = await Queue.countDocuments({
      doctorId: docAnil._id,
      status: { $in: ["ready-for-doctor", "in-consultation"] },
    });
    if (readyCount === 0) {
      console.log("Seeding ready-for-doctor queue items for Dr. Anil Kumar...");
      const allPatients = await Patient.find({}).limit(5);
      if (allPatients.length >= 3) {
        // Patient 1: Ready for Doctor (Rahul)
        await Queue.create({
          ticketNumber: "Q-031",
          patientId: allPatients[0]._id,
          doctorId: docAnil._id,
          department: "Cardiology",
          roomNumber: "Room 302",
          status: "ready-for-doctor",
          priority: "urgent",
          source: "appointment",
          checkedInTime: new Date(Date.now() - 35 * 60 * 1000),
          notes: "Triage complete: BP 142/92, reported dull retrosternal tightness",
        });

        // Patient 2: In Consultation (Sara / Anitha)
        await Queue.create({
          ticketNumber: "Q-032",
          patientId: allPatients[1]._id,
          doctorId: docAnil._id,
          department: "Cardiology",
          roomNumber: "Room 302",
          status: "in-consultation",
          priority: "priority",
          source: "appointment",
          checkedInTime: new Date(Date.now() - 50 * 60 * 1000),
          calledTime: new Date(Date.now() - 15 * 60 * 1000),
          notes: "In consultation: evaluation of exertional palpitations",
        });

        // Patient 3: Ready for Doctor (Marcus / Samuel)
        await Queue.create({
          ticketNumber: "Q-033",
          patientId: allPatients[2]._id,
          doctorId: docAnil._id,
          department: "Cardiology",
          roomNumber: "Room 302",
          status: "ready-for-doctor",
          priority: "normal",
          source: "appointment",
          checkedInTime: new Date(Date.now() - 25 * 60 * 1000),
          notes: "Routine quarterly cardiovascular wellness follow-up",
        });
      }
    }
  }

  // 24. Seed Lab Technician User (Vikram Malhotra) if not exists
  let labTechUser = await User.findOne({ email: "vikram@lab.caresync.com" });
  if (!labTechUser) {
    console.log("Seeding lab technician user (Vikram Malhotra)...");
    labTechUser = await User.create({
      name: "Vikram Malhotra",
      email: "vikram@lab.caresync.com",
      passwordHash: hashPassword("Password123!"),
      role: ROLES.LAB_TECHNICIAN,
      phone: "+1 (555) 019-3388",
      avatar:
        "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=200&q=80",
      status: "active",
    });
  }

  // 25. Seed Lab Technician Notifications if none exist
  const labNotifCount = await Notification.countDocuments({
    recipientId: labTechUser._id,
  });
  if (labNotifCount === 0) {
    console.log("Seeding lab technician notifications...");
    await Notification.insertMany([
      {
        recipientId: labTechUser._id,
        title: "STAT Laboratory Order: Rahul Verma",
        message:
          "Dr. Anil Kumar ordered STAT Cardiac Enzyme & Troponin I panel for patient Rahul Verma (Room 302). Immediate phlebotomy required.",
        type: "lab_report",
        link: "/lab/requests",
        isRead: false,
      },
      {
        recipientId: labTechUser._id,
        title: "Sample Recollection Warning: Sara Thomas",
        message:
          "Pre-analytical alert: Hemolysis detected on previous potassium tube. Re-collection requested by Pathologist Dr. Sunita Patil.",
        type: "system",
        link: "/lab/samples",
        isRead: false,
      },
      {
        recipientId: labTechUser._id,
        title: "Analyzer Maintenance Calibration Notice",
        message:
          "Sysmex XN-1000 hematology analyzer scheduled automated QC check completed successfully. Daily control values within 1.5 SD.",
        type: "system",
        link: "/lab/settings",
        isRead: true,
      },
      {
        recipientId: labTechUser._id,
        title: "Requisition Forwarded from Reception",
        message:
          "Outpatient phlebotomy appointment booked for Marcus Chen. Specimen tubes prepared for morning run.",
        type: "appointment",
        link: "/lab/requests",
        isRead: true,
      },
    ]);
  }

  // 26. Seed Doctor-created Lab Requests & Lab Samples across complete lifecycle
  const allPatientsList = await Patient.find({}).limit(5);
  const docAnilRef = (await Doctor.findOne({ name: /Anil/i })) || (await Doctor.findOne({}));

  if (allPatientsList.length > 0 && docAnilRef) {
    const p1 = allPatientsList[0];
    const p2 = allPatientsList[1] || p1;
    const p3 = allPatientsList[2] || p1;

    // Check if lifecycle lab requests exist
    const lifecycleCount = await LabReport.countDocuments({
      status: {
        $in: [
          "requested",
          "sample_pending",
          "sample_collected",
          "processing",
          "result_entered",
          "submitted_for_review",
        ],
      },
    });

    if (lifecycleCount === 0) {
      console.log("Seeding doctor lab requests across complete lifecycle...");

      // 1. Requested (STAT) - Doctor ordered, awaiting sample collection
      const req1 = await LabReport.create({
        patientId: p1._id,
        doctorId: docAnilRef._id,
        testName: "High-Sensitivity Cardiac Troponin I & CK-MB",
        department: "Clinical Chemistry",
        priority: "stat",
        sampleCollectionDate: new Date(),
        status: "requested",
        summary:
          "Clinical Order: Acute chest tightness evaluation, rule out non-ST elevation acute coronary syndrome.",
        technicianNotes: "STAT doctor requisition from Station 4 exam room.",
        verifiedBy: "Pending Lab Processing",
        results: [],
      });

      // 2. Sample Pending (Urgent) - Phlebotomist notified
      const req2 = await LabReport.create({
        patientId: p2._id,
        doctorId: docAnilRef._id,
        testName: "Comprehensive Lipid Profile & Apolipoprotein B",
        department: "Clinical Chemistry",
        priority: "urgent",
        sampleCollectionDate: new Date(),
        status: "sample_pending",
        summary:
          "Clinical Order: Cardiovascular risk re-stratification. Patient completed 12-hour fast.",
        technicianNotes: "Patient checked into phlebotomy wait area.",
        verifiedBy: "Pending Lab Processing",
        results: [],
      });

      // 3. Sample Collected (Routine) - LabSample created & barcode attached
      const req3 = await LabReport.create({
        patientId: p3._id,
        doctorId: docAnilRef._id,
        testName: "Complete Blood Count (CBC) with Differential",
        department: "Hematology",
        priority: "routine",
        sampleId: "SMP-2026-00125",
        sampleType: "Whole Blood (Venous)",
        tubeType: "Lavender Top (EDTA)",
        barcode: "CS-SMP-2026-00125-T792",
        sampleCollectionDate: new Date(Date.now() - 40 * 60 * 1000),
        sampleCollectedAt: new Date(Date.now() - 40 * 60 * 1000),
        sampleCollectedBy: "Vikram Malhotra, MLT",
        status: "sample_collected",
        summary:
          "Clinical Order: Routine cardiovascular monitoring and medication tolerance assessment.",
        technicianNotes: "Sample drawn smoothly from left antecubital fossa. Tube mixed 8-10 times.",
        verifiedBy: "Pending Lab Processing",
        results: [],
      });

      // Create linked LabSample for req3
      let sample1 = await LabSample.findOne({ sampleId: "SMP-2026-00125" });
      if (!sample1) {
        sample1 = await LabSample.create({
          sampleId: "SMP-2026-00125",
          labReportId: req3._id,
          patientId: p3._id,
          doctorId: docAnilRef._id,
          testName: "Complete Blood Count (CBC) with Differential",
          department: "Hematology",
          specimenType: "Whole Blood (Venous)",
          tubeType: "Lavender Top (EDTA)",
          barcode: "CS-SMP-2026-00125-T792",
          barcodeToken: "SMP-2026-00125-T792",
          collectionSite: "Station 2 Phlebotomy",
          collectedAt: new Date(Date.now() - 40 * 60 * 1000),
          collectedBy: "Vikram Malhotra, MLT",
          storageLocation: "Rack H-01 / Ambient (20-25°C)",
          volume: "3.5 mL",
          status: "collected",
          technicianNotes: "No hemolysis or clots observed.",
        });
      }
      req3.sampleDocId = sample1._id as any;
      await req3.save();


      // 4. Processing - Loaded on analyzer bench
      const req4 = await LabReport.create({
        patientId: p1._id,
        doctorId: docAnilRef._id,
        testName: "Serum Electrolytes & Renal Function Panel",
        department: "Clinical Chemistry",
        priority: "urgent",
        sampleId: "SMP-2026-00126",
        sampleType: "Serum",
        tubeType: "Gold Top (SST)",
        barcode: "CS-SMP-2026-00126-K481",
        sampleCollectionDate: new Date(Date.now() - 60 * 60 * 1000),
        sampleCollectedAt: new Date(Date.now() - 55 * 60 * 1000),
        sampleCollectedBy: "Vikram Malhotra, MLT",
        processingStartedAt: new Date(Date.now() - 20 * 60 * 1000),
        processingBy: "Vikram Malhotra, MLT",
        analyzerBench: "Roche Cobas 6000 Chemistry Analyzer",
        status: "processing",
        summary:
          "Clinical Order: Check for hypokalemia or renal impairment secondary to ACE inhibitor therapy.",
        technicianNotes: "Centrifuged at 3000 RPM for 10 min. Clear serum loaded onto Carousel Rack 4.",
        verifiedBy: "Pending Lab Processing",
        results: [],
      });

      let sample2 = await LabSample.findOne({ sampleId: "SMP-2026-00126" });
      if (!sample2) {
        sample2 = await LabSample.create({
          sampleId: "SMP-2026-00126",
          labReportId: req4._id,
          patientId: p1._id,
          doctorId: docAnilRef._id,
          testName: "Serum Electrolytes & Renal Function Panel",
          department: "Clinical Chemistry",
          specimenType: "Serum",
          tubeType: "Gold Top (SST)",
          barcode: "CS-SMP-2026-00126-K481",
          barcodeToken: "SMP-2026-00126-K481",
          collectionSite: "Station 2 Phlebotomy",
          collectedAt: new Date(Date.now() - 55 * 60 * 1000),
          collectedBy: "Vikram Malhotra, MLT",
          storageLocation: "Analyzer Carousel 4",
          volume: "5.0 mL",
          status: "processing",
          technicianNotes: "Centrifuged and actively analyzing.",
        });
      }
      req4.sampleDocId = sample2._id as any;
      await req4.save();

      // 5. Result Entered - Values entered by technician, awaiting final submission
      const req5 = await LabReport.create({
        patientId: p2._id,
        doctorId: docAnilRef._id,
        testName: "Thyroid Stimulating Hormone (TSH) & Free T4",
        department: "Immunology / Endocrinology",
        priority: "routine",
        sampleId: "SMP-2026-00127",
        sampleType: "Serum",
        tubeType: "Gold Top (SST)",
        barcode: "CS-SMP-2026-00127-M390",
        sampleCollectionDate: new Date(Date.now() - 90 * 60 * 1000),
        sampleCollectedAt: new Date(Date.now() - 85 * 60 * 1000),
        sampleCollectedBy: "Vikram Malhotra, MLT",
        processingStartedAt: new Date(Date.now() - 50 * 60 * 1000),
        processingBy: "Vikram Malhotra, MLT",
        analyzerBench: "Beckman Coulter Access 2 Immunoassay",
        resultEnteredAt: new Date(Date.now() - 10 * 60 * 1000),
        status: "result_entered",
        summary:
          "Clinical Order: Endocrine investigation for fatigue and baseline thyroid evaluation.",
        technicianNotes: "Calibrations verified. Values double-checked against instrument raw telemetry.",
        verifiedBy: "Pending Lab Processing",
        results: [
          {
            parameter: "Thyroid Stimulating Hormone (TSH)",
            value: "2.85",
            unit: "uIU/mL",
            referenceRange: "0.45 - 4.50",
            flag: "normal",
          },
          {
            parameter: "Free Thyroxine (FT4)",
            value: "1.24",
            unit: "ng/dL",
            referenceRange: "0.82 - 1.77",
            flag: "normal",
          },
        ],
      });

      let sample3 = await LabSample.findOne({ sampleId: "SMP-2026-00127" });
      if (!sample3) {
        sample3 = await LabSample.create({
          sampleId: "SMP-2026-00127",
          labReportId: req5._id,
          patientId: p2._id,
          doctorId: docAnilRef._id,
          testName: "Thyroid Stimulating Hormone (TSH) & Free T4",
          department: "Immunology / Endocrinology",
          specimenType: "Serum",
          tubeType: "Gold Top (SST)",
          barcode: "CS-SMP-2026-00127-M390",
          barcodeToken: "SMP-2026-00127-M390",
          collectionSite: "Station 2 Phlebotomy",
          collectedAt: new Date(Date.now() - 85 * 60 * 1000),
          collectedBy: "Vikram Malhotra, MLT",
          storageLocation: "Cold Rack R-02 / Shelf 1 (4°C)",
          volume: "4.5 mL",
          status: "analyzed",
          technicianNotes: "Analysis complete. Sample stored in 4°C archive.",
        });
      }
      req5.sampleDocId = sample3._id as any;
      await req5.save();

      // 6. Submitted for Review - Handed over to Pathologist Dr. Sunita Patil
      const req6 = await LabReport.create({
        patientId: p3._id,
        doctorId: docAnilRef._id,
        testName: "Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose",
        department: "Clinical Chemistry",
        priority: "routine",
        sampleId: "SMP-2026-00128",
        sampleType: "Whole Blood & Plasma",
        tubeType: "Gray Top (Sodium Fluoride) & Lavender (EDTA)",
        barcode: "CS-SMP-2026-00128-Z512",
        sampleCollectionDate: new Date(Date.now() - 180 * 60 * 1000),
        sampleCollectedAt: new Date(Date.now() - 170 * 60 * 1000),
        sampleCollectedBy: "Vikram Malhotra, MLT",
        processingStartedAt: new Date(Date.now() - 120 * 60 * 1000),
        processingBy: "Vikram Malhotra, MLT",
        analyzerBench: "Bio-Rad D-100 Hemoglobin Testing System",
        resultEnteredAt: new Date(Date.now() - 60 * 60 * 1000),
        submittedForReviewAt: new Date(Date.now() - 30 * 60 * 1000),
        submittedBy: "Vikram Malhotra, MLT",
        status: "submitted_for_review",
        summary:
          "Clinical Order: Diabetic glycemic control follow-up and treatment regimen adjustment.",
        technicianNotes:
          "HPLC analysis showed standard chromatographic resolution with no variant hemoglobin interference.",
        verifiedBy: "Awaiting Pathologist Review (Dr. Sunita Patil, MD)",
        results: [
          {
            parameter: "Glycated Hemoglobin (HbA1c)",
            value: "6.8",
            unit: "%",
            referenceRange: "< 5.7 (Normal), 5.7 - 6.4 (Prediabetes)",
            flag: "high",
          },
          {
            parameter: "Estimated Average Glucose (eAG)",
            value: "149",
            unit: "mg/dL",
            referenceRange: "70 - 126",
            flag: "high",
          },
          {
            parameter: "Fasting Plasma Glucose",
            value: "132",
            unit: "mg/dL",
            referenceRange: "70 - 99",
            flag: "high",
          },
        ],
      });

      let sample4 = await LabSample.findOne({ sampleId: "SMP-2026-00128" });
      if (!sample4) {
        sample4 = await LabSample.create({
          sampleId: "SMP-2026-00128",
          labReportId: req6._id,
          patientId: p3._id,
          doctorId: docAnilRef._id,
          testName: "Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose",
          department: "Clinical Chemistry",
          specimenType: "Whole Blood & Plasma",
          tubeType: "Gray Top (Sodium Fluoride) & Lavender (EDTA)",
          barcode: "CS-SMP-2026-00128-Z512",
          barcodeToken: "SMP-2026-00128-Z512",
          collectionSite: "Station 2 Phlebotomy",
          collectedAt: new Date(Date.now() - 170 * 60 * 1000),
          collectedBy: "Vikram Malhotra, MLT",
          storageLocation: "Cold Rack R-02 / Shelf 2 (4°C)",
          volume: "4.0 mL",
          status: "analyzed",
          technicianNotes: "Submitted to Dr. Sunita Patil for pathologist verification.",
        });
      }
      req6.sampleDocId = sample4._id as any;
      await req6.save();
    }
  }

  // 27. Seed Pathologist User (Dr. Sunita Patil, MD)
  let pathologistUser = await User.findOne({ email: "sunita@pathology.caresync.com" });
  if (!pathologistUser) {
    console.log("Seeding pathologist user (Dr. Sunita Patil)...");
    pathologistUser = await User.create({
      name: "Dr. Sunita Patil, MD",
      email: "sunita@pathology.caresync.com",
      passwordHash: hashPassword("Password123!"),
      role: ROLES.PATHOLOGIST,
      phone: "+1 (555) 019-7721",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
      status: "active",
    });
  }

  // 28. Seed Pathologist Notifications if none exist
  const pathNotifCount = await Notification.countDocuments({
    recipientId: pathologistUser._id,
  });
  if (pathNotifCount === 0) {
    console.log("Seeding pathologist notifications...");
    await Notification.insertMany([
      {
        recipientId: pathologistUser._id,
        type: "lab_report",
        title: "STAT Lab Requisition Awaiting Verification",
        message: "High-Sensitivity Cardiac Troponin I Panel for Anita Desai submitted with elevated panic value (0.082 ng/mL).",
        isRead: false,
        link: "/pathologist/reports",
      },
      {
        recipientId: pathologistUser._id,
        type: "system",
        title: "Correction Cycle Update",
        message: "Phlebotomy Station 2 completed requested redraw on TSH hemolyzed specimen SMP-2026-00127.",
        isRead: false,
        link: "/pathologist/reports",
      },
      {
        recipientId: pathologistUser._id,
        type: "system",
        title: "Physician Consult: Lipid Index",
        message: "Dr. Anil Kumar requested histology correlation notes on patient Marcus Brody lipid panel.",
        isRead: true,
        link: "/pathologist/verified",
      },
    ]);
  }

  // 29. Seed specific reports across the 4 Pathologist review states if not existing
  const existingUnderReview = await LabReport.findOne({ status: "under_review" });
  if (!existingUnderReview) {
    const p1 = (await Patient.findOne({}))!;
    const d1 = (await Doctor.findOne({}))!;
    await LabReport.create({
      patientId: p1._id,
      doctorId: d1._id,
      testName: "Complete Blood Count (CBC with Automated Differential)",
      department: "Hematology & Coagulation",
      priority: "urgent",
      sampleId: "SMP-2026-00130",
      sampleType: "Whole Blood",
      tubeType: "Lavender Top (EDTA)",
      barcode: "CS-SMP-2026-00130-H81",
      sampleCollectionDate: new Date(Date.now() - 4 * 3600 * 1000),
      sampleCollectedAt: new Date(Date.now() - 4 * 3600 * 1000),
      sampleCollectedBy: "Vikram Malhotra, MLT",
      processingStartedAt: new Date(Date.now() - 3 * 3600 * 1000),
      processingBy: "Vikram Malhotra, MLT",
      analyzerBench: "Sysmex XN-1000 Hematology System",
      resultEnteredAt: new Date(Date.now() - 2 * 3600 * 1000),
      submittedForReviewAt: new Date(Date.now() - 90 * 60 * 1000),
      submittedBy: "Vikram Malhotra, MLT",
      underReviewAt: new Date(Date.now() - 40 * 60 * 1000),
      underReviewBy: "Dr. Sunita Patil, MD",
      status: "under_review",
      summary: "Mild normocytic anemia noted with borderline reactive lymphocytosis. Peripheral smear review in progress.",
      technicianNotes: "Analyzed on Sysmex XN-1000. Flagged for manual differential verification.",
      pathologistNotes: "Under microscopic review for atypical lymphocytes and red cell indices.",
      pathologistInterpretation: "Mild normocytic normochromic anemia (Hb 10.8 g/dL). Lymphocyte morphology largely reactive without evidence of blasts or dysplastic series.",
      pathologistComments: "Correlate with serum ferritin and iron saturation indices.",
      results: [
        { parameter: "White Blood Cells (WBC)", value: "11.4", unit: "10^3/uL", referenceRange: "4.5 - 11.0", flag: "high" },
        { parameter: "Red Blood Cells (RBC)", value: "3.78", unit: "10^6/uL", referenceRange: "4.30 - 5.90", flag: "low" },
        { parameter: "Hemoglobin (Hgb)", value: "10.8", unit: "g/dL", referenceRange: "13.5 - 17.5", flag: "low" },
        { parameter: "Hematocrit (Hct)", value: "33.2", unit: "%", referenceRange: "41.0 - 50.0", flag: "low" },
        { parameter: "Platelet Count", value: "245", unit: "10^3/uL", referenceRange: "150 - 450", flag: "normal" },
      ],
    });
  }

  const existingCorrection = await LabReport.findOne({ status: "correction_required" });
  if (!existingCorrection) {
    const p2 = (await Patient.findOne({}).skip(1)) || (await Patient.findOne({}))!;
    const d2 = (await Doctor.findOne({}))!;
    await LabReport.create({
      patientId: p2._id,
      doctorId: d2._id,
      testName: "Thyroid Stimulating Hormone (TSH w/ Reflex Free T4)",
      department: "Clinical Endocrinology",
      priority: "routine",
      sampleId: "SMP-2026-00127",
      sampleType: "Serum",
      tubeType: "Gold Top (SST / Gel)",
      barcode: "CS-SMP-2026-00127-T49",
      sampleCollectionDate: new Date(Date.now() - 8 * 3600 * 1000),
      sampleCollectedAt: new Date(Date.now() - 7 * 3600 * 1000),
      sampleCollectedBy: "Vikram Malhotra, MLT",
      processingStartedAt: new Date(Date.now() - 6 * 3600 * 1000),
      processingBy: "Vikram Malhotra, MLT",
      analyzerBench: "Abbott Architect i2000SR Immunoassay",
      resultEnteredAt: new Date(Date.now() - 5 * 3600 * 1000),
      submittedForReviewAt: new Date(Date.now() - 4 * 3600 * 1000),
      submittedBy: "Vikram Malhotra, MLT",
      correctionRequestedAt: new Date(Date.now() - 3 * 3600 * 1000),
      correctionReason: "Moderate hemolysis index (+3) detected on sample serum tube. Falsely depressed Free T4 suspected. Redraw requested at Phlebotomy Station 2.",
      status: "correction_required",
      summary: "Pre-analytical interference flagged. Specimen recollected and awaiting wet bench re-run.",
      technicianNotes: "Initial sample showed hemolysis index +3. Redraw initiated per pathologist directive.",
      pathologistNotes: "Specimen recollection required prior to diagnostic certification.",
      results: [
        { parameter: "Thyroid Stimulating Hormone (TSH)", value: "5.82", unit: "uIU/mL", referenceRange: "0.40 - 4.50", flag: "high" },
        { parameter: "Free Thyroxine (FT4)", value: "0.71", unit: "ng/dL", referenceRange: "0.80 - 1.80", flag: "low" },
      ],
    });
  }

  // 29. Seed Pharmacist User (Deepak Varma, RPh)
  let pharmacyUser = await User.findOne({ email: "deepak@pharmacy.caresync.com" });
  if (!pharmacyUser) {
    console.log("Seeding pharmacist user (Deepak Varma)...");
    pharmacyUser = await User.create({
      name: "Deepak Varma, RPh",
      email: "deepak@pharmacy.caresync.com",
      passwordHash: hashPassword("Password123!"),
      role: ROLES.PHARMACY,
      phone: "+1 (555) 345-6789",
      avatar: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=300&q=80",
      status: "active",
    });
  }

  // 30. Seed V1 Medicines Inventory
  const medicineCount = await Medicine.countDocuments();
  if (medicineCount === 0) {
    console.log("Seeding V1 medicines inventory...");
    await Medicine.create([
      {
        name: "Amoxicillin 500mg",
        genericName: "Amoxicillin Trihydrate",
        category: "Antibiotics",
        availableQuantity: 450,
        unit: "capsules",
        lowStockThreshold: 100,
        status: "in_stock",
        unitPrice: 12.5,
        location: "Shelf A-01",
        description: "Broad-spectrum penicillin antibiotic for bacterial infections.",
      },
      {
        name: "Atorvastatin 20mg",
        genericName: "Atorvastatin Calcium",
        category: "Cardiovascular",
        availableQuantity: 320,
        unit: "tablets",
        lowStockThreshold: 80,
        status: "in_stock",
        unitPrice: 18.0,
        location: "Shelf B-04",
        description: "HMG-CoA reductase inhibitor for dyslipidemia and hypercholesterolemia.",
      },
      {
        name: "Metformin 500mg",
        genericName: "Metformin Hydrochloride",
        category: "Antidiabetic",
        availableQuantity: 580,
        unit: "tablets",
        lowStockThreshold: 150,
        status: "in_stock",
        unitPrice: 8.2,
        location: "Shelf B-07",
        description: "Biguanide antihyperglycemic for Type 2 Diabetes Mellitus management.",
      },
      {
        name: "Lisinopril 10mg",
        genericName: "Lisinopril Anhydrous",
        category: "Antihypertensive",
        availableQuantity: 18,
        unit: "tablets",
        lowStockThreshold: 50,
        status: "low_stock",
        unitPrice: 14.0,
        location: "Shelf B-11",
        description: "ACE inhibitor used in hypertension and congestive heart failure.",
      },
      {
        name: "Albuterol 90mcg Inhaler",
        genericName: "Albuterol Sulfate HFA",
        category: "Respiratory",
        availableQuantity: 6,
        unit: "inhalers",
        lowStockThreshold: 20,
        status: "low_stock",
        unitPrice: 35.0,
        location: "Rack D-02",
        description: "Beta-2 adrenergic bronchodilator for bronchospasm and acute asthma relief.",
      },
      {
        name: "Omeprazole 20mg",
        genericName: "Omeprazole Delayed-Release",
        category: "Gastrointestinal",
        availableQuantity: 240,
        unit: "capsules",
        lowStockThreshold: 60,
        status: "in_stock",
        unitPrice: 15.5,
        location: "Shelf C-03",
        description: "Proton pump inhibitor for GERD, dyspepsia, and gastric ulcer prophylaxis.",
      },
      {
        name: "Cetirizine 10mg",
        genericName: "Cetirizine Dihydrochloride",
        category: "Antihistamine",
        availableQuantity: 400,
        unit: "tablets",
        lowStockThreshold: 75,
        status: "in_stock",
        unitPrice: 6.0,
        location: "Shelf A-05",
        description: "Second-generation H1 antagonist for allergic rhinitis and urticaria.",
      },
      {
        name: "Paracetamol 650mg",
        genericName: "Acetaminophen",
        category: "Analgesic & Antipyretic",
        availableQuantity: 850,
        unit: "tablets",
        lowStockThreshold: 200,
        status: "in_stock",
        unitPrice: 4.5,
        location: "Shelf A-02",
        description: "First-line analgesic and antipyretic for pain and fever control.",
      },
      {
        name: "Azithromycin 250mg",
        genericName: "Azithromycin Dihydrate",
        category: "Antibiotics",
        availableQuantity: 0,
        unit: "tablets",
        lowStockThreshold: 40,
        status: "out_of_stock",
        unitPrice: 22.0,
        location: "Shelf A-03",
        description: "Macrolide antibiotic for upper and lower respiratory tract infections.",
      },
      {
        name: "Insulin Glargine 100 U/mL",
        genericName: "Insulin Glargine Recombinant",
        category: "Endocrine / Diabetes",
        availableQuantity: 14,
        unit: "vials",
        lowStockThreshold: 25,
        status: "low_stock",
        unitPrice: 88.0,
        location: "Cold Vault F-01",
        description: "Long-acting basal human insulin analogue for 24-hour glycemic control.",
      },
      {
        name: "Amlodipine 5mg",
        genericName: "Amlodipine Besylate",
        category: "Antihypertensive",
        availableQuantity: 420,
        unit: "tablets",
        lowStockThreshold: 90,
        status: "in_stock",
        unitPrice: 9.8,
        location: "Shelf B-09",
        description: "Dihydropyridine calcium channel blocker for systemic hypertension.",
      },
      {
        name: "Ibuprofen 400mg",
        genericName: "Ibuprofen BP",
        category: "NSAID",
        availableQuantity: 360,
        unit: "tablets",
        lowStockThreshold: 80,
        status: "in_stock",
        unitPrice: 7.2,
        location: "Shelf A-04",
        description: "Non-steroidal anti-inflammatory drug for pain, swelling and inflammation.",
      },
    ]);
  }

  // 31. Seed Doctor Prescriptions across pharmacy statuses
  const allPatients = await Patient.find({});
  const allDoctors = await Doctor.find({});
  const primaryPatient = allPatients[0];
  const secondPatient = allPatients[1] || primaryPatient;
  const thirdPatient = allPatients[2] || primaryPatient;
  const prescribingDoc1 = allDoctors[0];
  const prescribingDoc2 = allDoctors[1] || prescribingDoc1;

  // Check if we need to seed pharmacy-specific prescriptions
  const pendingRxCount = await Prescription.countDocuments({ status: "pending" });
  if (pendingRxCount === 0 && primaryPatient && prescribingDoc1) {
    console.log("Seeding pending prescriptions for pharmacy queue...");
    await Prescription.create([
      {
        patientId: primaryPatient._id,
        doctorId: prescribingDoc1._id,
        date: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
        status: "pending",
        medications: [
          {
            medicine: "Amoxicillin 500mg",
            dosage: "500mg",
            frequency: "Three times daily (TID)",
            duration: "7 days",
            instructions: "Take after meals with plenty of water. Complete full course.",
            refillsRemaining: 0,
          },
          {
            medicine: "Paracetamol 650mg",
            dosage: "650mg",
            frequency: "As needed every 6 hours (PRN)",
            duration: "5 days",
            instructions: "For relief of mild to moderate fever or pain. Do not exceed 4g/day.",
            refillsRemaining: 1,
          },
        ],
        notes: "Acute bacterial sinusitis. Patient reports symptoms started 4 days ago.",
      },
      {
        patientId: secondPatient._id,
        doctorId: prescribingDoc2._id,
        date: new Date(Date.now() - 90 * 60 * 1000), // 1.5 hours ago
        status: "pending",
        medications: [
          {
            medicine: "Metformin 500mg",
            dosage: "500mg",
            frequency: "Twice daily (BID)",
            duration: "30 days",
            instructions: "Take with morning and evening meals to minimize GI upset.",
            refillsRemaining: 2,
          },
          {
            medicine: "Atorvastatin 20mg",
            dosage: "20mg",
            frequency: "Once daily at bedtime (QHS)",
            duration: "30 days",
            instructions: "Take at nighttime with or without food.",
            refillsRemaining: 3,
          },
        ],
        notes: "Routine quarterly diabetic and lipid management renewal.",
      },
    ]);
  }

  // Seed Ready for Dispensing prescription
  const readyRx = await Prescription.findOne({ status: "ready" });
  if (!readyRx && thirdPatient && prescribingDoc1) {
    console.log("Seeding ready prescription for dispensing...");
    await Prescription.create({
      patientId: thirdPatient._id,
      doctorId: prescribingDoc1._id,
      date: new Date(Date.now() - 3 * 3600 * 1000),
      status: "ready",
      medications: [
        {
          medicine: "Omeprazole 20mg",
          dosage: "20mg",
          frequency: "Once daily in morning (QAM)",
          duration: "14 days",
          instructions: "Take 30 minutes before first meal of the day.",
          refillsRemaining: 1,
        },
        {
          medicine: "Cetirizine 10mg",
          dosage: "10mg",
          frequency: "Once daily at bedtime (QHS)",
          duration: "10 days",
          instructions: "May cause slight drowsiness. Avoid alcohol.",
          refillsRemaining: 0,
        },
      ],
      notes: "Gastric acid reflux with co-existing allergic symptoms.",
      pharmacistNotes: "Verified inventory in Stock A-05 and C-03. Ready for label generation & pickup.",
      reviewedAt: new Date(Date.now() - 2 * 3600 * 1000),
    });
  }

  // Seed Clarification Requested prescription
  const clarificationRx = await Prescription.findOne({ status: "clarification_requested" });
  if (!clarificationRx && secondPatient && prescribingDoc2) {
    console.log("Seeding clarification-requested prescription...");
    await Prescription.create({
      patientId: secondPatient._id,
      doctorId: prescribingDoc2._id,
      date: new Date(Date.now() - 5 * 3600 * 1000),
      status: "clarification_requested",
      medications: [
        {
          medicine: "Lisinopril 10mg",
          dosage: "20mg",
          frequency: "Twice daily (BID)",
          duration: "30 days",
          instructions: "Take in the morning and evening.",
          refillsRemaining: 2,
        },
      ],
      notes: "Hypertension escalation regimen.",
      clarificationReason: "Prescribed 20mg BID (total 40mg/day). Standard starting dose for patient's recorded renal function is 10mg once daily. Contacting Dr. Rajesh Kumar to confirm daily ceiling dose.",
      pharmacistNotes: "Flagged high dosage for physician re-confirmation. Call placed to Cardiology Department.",
    });
  }

  // 32. Seed Completed Dispensing Records & History
  const dispenseCount = await DispensingRecord.countDocuments();
  if (dispenseCount === 0 && primaryPatient && prescribingDoc1) {
    console.log("Seeding completed dispensing records...");
    const amoxMed = await Medicine.findOne({ name: /Amoxicillin/i });
    const paraMed = await Medicine.findOne({ name: /Paracetamol/i });

    // Completed prescription
    const completedRx = await Prescription.create({
      patientId: primaryPatient._id,
      doctorId: prescribingDoc1._id,
      date: new Date(Date.now() - 24 * 3600 * 1000),
      status: "completed",
      medications: [
        {
          medicine: "Amoxicillin 500mg",
          dosage: "500mg",
          frequency: "TID",
          duration: "7 days",
          instructions: "Take after meals.",
          refillsRemaining: 0,
        },
        {
          medicine: "Paracetamol 650mg",
          dosage: "650mg",
          frequency: "PRN every 6h",
          duration: "3 days",
          instructions: "Take with water.",
          refillsRemaining: 0,
        },
      ],
      notes: "Post-op dental extraction antibiotic prophylaxis.",
      pharmacistNotes: "Dispensed and counseled patient on completing antibiotic course.",
      reviewedAt: new Date(Date.now() - 23 * 3600 * 1000),
    });

    const dsp1 = await DispensingRecord.create({
      dispenseId: "DSP-2026-00041",
      prescriptionId: completedRx._id,
      patientId: primaryPatient._id,
      doctorId: prescribingDoc1._id,
      pharmacistName: "Deepak Varma, RPh",
      items: [
        {
          medicineId: amoxMed?._id,
          medicineName: "Amoxicillin 500mg",
          dosage: "500mg",
          frequency: "TID",
          duration: "7 days",
          quantityDispensed: 21,
          unit: "capsules",
          instructions: "Take after meals with water.",
          batchNumber: "AMX-2026-B1",
        },
        {
          medicineId: paraMed?._id,
          medicineName: "Paracetamol 650mg",
          dosage: "650mg",
          frequency: "PRN every 6h",
          duration: "3 days",
          quantityDispensed: 12,
          unit: "tablets",
          instructions: "For relief of mild discomfort.",
          batchNumber: "PCM-2026-F9",
        },
      ],
      dispensedDate: new Date(Date.now() - 22 * 3600 * 1000),
      status: "completed",
      notes: "Patient counseled on completing full antibiotic course. No known allergies to penicillin confirmed.",
    });

    completedRx.dispensingRecordId = dsp1._id as any;
    await completedRx.save();

    // Dispensing in progress today
    const inProgressRx = await Prescription.create({
      patientId: secondPatient._id,
      doctorId: prescribingDoc2._id,
      date: new Date(Date.now() - 2 * 3600 * 1000),
      status: "dispensing",
      medications: [
        {
          medicine: "Metformin 500mg",
          dosage: "500mg",
          frequency: "BID",
          duration: "30 days",
          instructions: "Take with meals.",
          refillsRemaining: 1,
        },
      ],
      notes: "Endocrine refill.",
      pharmacistNotes: "Packaging & affixing warning labels.",
      reviewedAt: new Date(Date.now() - 1 * 3600 * 1000),
    });

    const metMed = await Medicine.findOne({ name: /Metformin/i });
    const dsp2 = await DispensingRecord.create({
      dispenseId: "DSP-2026-00042",
      prescriptionId: inProgressRx._id,
      patientId: secondPatient._id,
      doctorId: prescribingDoc2._id,
      pharmacistName: "Deepak Varma, RPh",
      items: [
        {
          medicineId: metMed?._id,
          medicineName: "Metformin 500mg",
          dosage: "500mg",
          frequency: "BID",
          duration: "30 days",
          quantityDispensed: 60,
          unit: "tablets",
          instructions: "Take with morning and evening meals.",
          batchNumber: "MET-2026-D4",
        },
      ],
      dispensedDate: new Date(Date.now() - 30 * 60 * 1000),
      status: "preparing",
      notes: "Counting completed; printing auxiliary warning labels.",
    });

    inProgressRx.dispensingRecordId = dsp2._id as any;
    await inProgressRx.save();
  }

  // 33. Seed Pharmacy Notifications
  if (pharmacyUser) {
    const rxNotifCount = await Notification.countDocuments({
      recipientId: pharmacyUser._id,
    });
    if (rxNotifCount === 0) {
      console.log("Seeding pharmacy notifications...");
      await Notification.create([
        {
          recipientId: pharmacyUser._id,
          title: "New Prescription Awaiting Review",
          message: "Dr. Anjali Menon submitted a prescription for Rahul K. (Amoxicillin 500mg, Paracetamol 650mg).",
          type: "prescription",
          link: "/pharmacy/prescriptions",
          isRead: false,
        },
        {
          recipientId: pharmacyUser._id,
          title: "Low Inventory Alert: Lisinopril 10mg",
          message: "Stock has fallen to 18 tablets, below the threshold of 50 tablets.",
          type: "prescription",
          link: "/pharmacy/medicines",
          isRead: false,
        },
        {
          recipientId: pharmacyUser._id,
          title: "Critical Low Stock: Albuterol Inhaler",
          message: "Only 6 units remaining in Rack D-02 (Threshold: 20 inhalers).",
          type: "prescription",
          link: "/pharmacy/medicines",
          isRead: true,
        },
      ]);
    }
  }

  // 34. Seed Billing Staff User (Meera Nair)
  let billingUser = await User.findOne({ email: "meera@billing.caresync.com" });
  if (!billingUser) {
    console.log("Seeding billing staff user (Meera Nair)...");
    billingUser = await User.create({
      name: "Meera Nair",
      email: "meera@billing.caresync.com",
      passwordHash: hashPassword("Password123!"),
      role: ROLES.BILLING,
      phone: "+1 (555) 456-7890",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80",
      status: "active",
    });
  }

  // 35. Seed Invoices and Payments (Strictly Financial, No Discharge)
  const invoiceCount = await Invoice.countDocuments();
  if (invoiceCount === 0 && primaryPatient && prescribingDoc1) {
    console.log("Seeding billing invoices and payments...");

    // Invoice 1: Fully Paid
    const inv1 = await Invoice.create({
      invoiceNumber: "INV-2026-00101",
      patientId: primaryPatient._id,
      doctorId: prescribingDoc2._id,
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() + 25 * 24 * 3600 * 1000),
      services: [
        {
          serviceName: "Cardiology Specialist Consultation",
          category: "consultation",
          quantity: 1,
          unitPrice: 180,
          subtotal: 180,
        },
        {
          serviceName: "12-Lead Electrocardiogram (ECG)",
          category: "procedure",
          quantity: 1,
          unitPrice: 70,
          subtotal: 70,
        },
      ],
      subtotalAmount: 250,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 250,
      paidAmount: 250,
      balanceAmount: 0,
      status: "paid",
      notes: "Routine preventive cardiology assessment. Paid in full via card.",
      createdByName: "Meera Nair, Billing Specialist",
    });

    // Payment for Invoice 1
    await Payment.create({
      transactionNumber: "TXN-2026-00041",
      invoiceId: inv1._id,
      patientId: primaryPatient._id,
      amount: 250,
      paymentMethod: "credit_card",
      referenceNumber: "AUTH-CC-849201",
      paymentDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      status: "completed",
      receivedByName: "Meera Nair, Billing Specialist",
      notes: "Visa ending in 4192. POS Counter 1.",
    });

    // Invoice 2: Partially Paid
    const inv2 = await Invoice.create({
      invoiceNumber: "INV-2026-00102",
      patientId: secondPatient._id,
      doctorId: prescribingDoc1._id,
      date: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() + 27 * 24 * 3600 * 1000),
      services: [
        {
          serviceName: "Endocrine & Metabolic Comprehensive Evaluation",
          category: "consultation",
          quantity: 1,
          unitPrice: 200,
          subtotal: 200,
        },
        {
          serviceName: "Comprehensive Metabolic Panel (CMP 14)",
          category: "laboratory",
          quantity: 1,
          unitPrice: 140,
          subtotal: 140,
        },
        {
          serviceName: "Metformin 500mg (60 Tabs) Dispensary Order",
          category: "pharmacy",
          quantity: 1,
          unitPrice: 80,
          subtotal: 80,
        },
      ],
      subtotalAmount: 420,
      discountAmount: 20,
      taxAmount: 0,
      totalAmount: 400,
      paidAmount: 200,
      balanceAmount: 200,
      status: "partially_paid",
      notes: "Patient copay settled. Remaining $200 awaiting secondary insurance claim adjudication.",
      createdByName: "Meera Nair, Billing Specialist",
    });

    // Payment for Invoice 2
    await Payment.create({
      transactionNumber: "TXN-2026-00042",
      invoiceId: inv2._id,
      patientId: secondPatient._id,
      amount: 200,
      paymentMethod: "insurance",
      referenceNumber: "CLM-BCBS-91823",
      paymentDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      status: "completed",
      receivedByName: "Meera Nair, Billing Specialist",
      notes: "Initial insurance copay reimbursement processed.",
    });

    // Invoice 3: Unpaid / Pending
    await Invoice.create({
      invoiceNumber: "INV-2026-00103",
      patientId: primaryPatient._id,
      doctorId: prescribingDoc1._id,
      date: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() + 29 * 24 * 3600 * 1000),
      services: [
        {
          serviceName: "General Medical Consultation",
          category: "consultation",
          quantity: 1,
          unitPrice: 120,
          subtotal: 120,
        },
        {
          serviceName: "Amoxicillin 500mg (21 Caps) Prescription",
          category: "pharmacy",
          quantity: 1,
          unitPrice: 45,
          subtotal: 45,
        },
      ],
      subtotalAmount: 165,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 165,
      paidAmount: 0,
      balanceAmount: 165,
      status: "pending",
      notes: "Issued upon pharmacy dispensing completion. Due in 30 days.",
      createdByName: "Meera Nair, Billing Specialist",
    });

    // Invoice 4: Overdue
    await Invoice.create({
      invoiceNumber: "INV-2026-00098",
      patientId: thirdPatient._id,
      doctorId: prescribingDoc2._id,
      date: new Date(Date.now() - 45 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() - 15 * 24 * 3600 * 1000), // Past due
      services: [
        {
          serviceName: "Orthopedic Subspecialty Consultation",
          category: "consultation",
          quantity: 1,
          unitPrice: 220,
          subtotal: 220,
        },
        {
          serviceName: "Knee Joint Bilateral X-Ray Imaging",
          category: "radiology",
          quantity: 1,
          unitPrice: 160,
          subtotal: 160,
        },
      ],
      subtotalAmount: 380,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 380,
      paidAmount: 0,
      balanceAmount: 380,
      status: "overdue",
      notes: "Payment reminder notification dispatched. Balance past 30-day net terms.",
      createdByName: "Meera Nair, Billing Specialist",
    });

    // Invoice 5: Today's New Invoice
    await Invoice.create({
      invoiceNumber: "INV-2026-00104",
      patientId: secondPatient._id,
      doctorId: prescribingDoc1._id,
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      services: [
        {
          serviceName: "Dermatological Lesion Assessment",
          category: "consultation",
          quantity: 1,
          unitPrice: 150,
          subtotal: 150,
        },
        {
          serviceName: "Punch Biopsy Clinical Procedure",
          category: "procedure",
          quantity: 1,
          unitPrice: 140,
          subtotal: 140,
        },
      ],
      subtotalAmount: 290,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 290,
      paidAmount: 0,
      balanceAmount: 290,
      status: "pending",
      notes: "Outpatient clinical billing record generated today.",
      createdByName: "Meera Nair, Billing Specialist",
    });
  }

  // 36. Seed Billing Notifications
  if (billingUser) {
    const billingNotifCount = await Notification.countDocuments({
      recipientId: billingUser._id,
    });
    if (billingNotifCount === 0) {
      console.log("Seeding billing staff notifications...");
      await Notification.create([
        {
          recipientId: billingUser._id,
          title: "New Outpatient Invoice Generated",
          message: "Invoice INV-2026-00104 ($290.00) issued for Marcus Chen.",
          type: "system",
          link: "/billing/invoices",
          isRead: false,
        },
        {
          recipientId: billingUser._id,
          title: "Overdue Account Flagged: INV-2026-00098",
          message: "Outstanding balance of $380.00 is 15 days past due date.",
          type: "system",
          link: "/billing/outstanding",
          isRead: false,
        },
        {
          recipientId: billingUser._id,
          title: "Payment Confirmation: $250.00 Settled",
          message: "Card transaction TXN-2026-00041 completed for Rahul K.",
          type: "system",
          link: "/billing/history",
          isRead: true,
        },
      ]);
    }
  }

  // 37. Seed Admin User (Alexander Wright)
  let adminUser = await User.findOne({ email: "admin@caresync.com" });
  if (!adminUser) {
    console.log("Seeding administrator user (Alexander Wright)...");
    adminUser = await User.create({
      name: "Alexander Wright",
      email: "admin@caresync.com",
      passwordHash: hashPassword("Password123!"),
      role: ROLES.ADMIN,
      phone: "+1 (555) 901-2244",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      status: "active",
    });
  }

  // 38. Seed Departments
  const deptCount = await Department.countDocuments();
  if (deptCount === 0) {
    console.log("Seeding clinical and administrative departments...");
    await Department.create([
      {
        name: "Cardiology",
        code: "CARD",
        description: "Comprehensive cardiovascular diagnostics, electrophysiology, and non-invasive therapy.",
        headOfDepartment: "Dr. Rajesh Kumar",
        location: "Building A, 4th Floor, East Wing",
        phone: "+1 (555) 400-1010",
        email: "cardiology@caresync.com",
        operatingHours: { start: "08:00 AM", end: "08:00 PM" },
        status: "active",
      },
      {
        name: "General Medicine",
        code: "GENMED",
        description: "Primary ambulatory outpatient evaluations, chronic disease management, and internal medicine.",
        headOfDepartment: "Dr. Anjali Menon",
        location: "Building A, 3rd Floor, Central",
        phone: "+1 (555) 400-1020",
        email: "medicine@caresync.com",
        operatingHours: { start: "08:00 AM", end: "10:00 PM" },
        status: "active",
      },
      {
        name: "Pediatrics",
        code: "PED",
        description: "Neonatal, infant, and adolescent preventative health, vaccinations, and acute care.",
        headOfDepartment: "Dr. Priya Nair",
        location: "Building B, 2nd Floor, Pediatric Wing",
        phone: "+1 (555) 400-1030",
        email: "pediatrics@caresync.com",
        operatingHours: { start: "08:30 AM", end: "06:00 PM" },
        status: "active",
      },
      {
        name: "Orthopedics",
        code: "ORTHO",
        description: "Musculoskeletal trauma, joint preservation, sports injuries, and rehabilitation therapy.",
        headOfDepartment: "Dr. Vikram Rao",
        location: "Building B, 3rd Floor, West Wing",
        phone: "+1 (555) 400-1040",
        email: "orthopedics@caresync.com",
        operatingHours: { start: "09:00 AM", end: "05:00 PM" },
        status: "active",
      },
      {
        name: "Dermatology",
        code: "DERM",
        description: "Clinical skin pathology, allergy testing, laser interventions, and topical care.",
        headOfDepartment: "Dr. Sunita Patil",
        location: "Building A, 2nd Floor, Suite 208",
        phone: "+1 (555) 400-1050",
        email: "dermatology@caresync.com",
        operatingHours: { start: "09:00 AM", end: "05:00 PM" },
        status: "active",
      },
      {
        name: "Pathology & Laboratory",
        code: "PATHLAB",
        description: "Hematology, clinical biochemistry, automated serology, and diagnostic cytology services.",
        headOfDepartment: "Dr. Sunita Patil",
        location: "Basement Level 1, Diagnostics Center",
        phone: "+1 (555) 400-1060",
        email: "lab.ops@caresync.com",
        operatingHours: { start: "07:00 AM", end: "11:00 PM" },
        status: "active",
      },
      {
        name: "Central Pharmacy",
        code: "PHARM",
        description: "Hospital formulary dispensing, inventory logistics, medication reconciliation, and patient counseling.",
        headOfDepartment: "Deepak Varma, RPh",
        location: "Ground Floor, Main Entrance Atrium",
        phone: "+1 (555) 400-1070",
        email: "pharmacy.ops@caresync.com",
        operatingHours: { start: "00:00 AM", end: "11:59 PM" },
        status: "active",
      },
      {
        name: "Finance & Accounts",
        code: "FINANCE",
        description: "Patient accounting, billing settlement desks, cashier audit reconciliation, and revenue assurance.",
        headOfDepartment: "Meera Nair",
        location: "Ground Floor, Cashier Desks 1-4",
        phone: "+1 (555) 400-1080",
        email: "billing.ops@caresync.com",
        operatingHours: { start: "08:00 AM", end: "08:00 PM" },
        status: "active",
      },
    ]);
  }

  // 39. Seed Staff Profiles
  const staffCount = await Staff.countDocuments();
  if (staffCount === 0) {
    console.log("Seeding staff profiles...");
    await Staff.create([
      {
        employeeId: "STF-2026-001",
        userId: receptionUser?._id,
        fullName: "Sarah Adams",
        email: "sarah@reception.caresync.com",
        phone: "+1 (555) 123-4567",
        role: "receptionist",
        department: "General Medicine",
        designation: "Lead Receptionist & Triage Coordinator",
        shift: "Morning (07:30 - 15:30)",
        status: "active",
        joinedDate: new Date("2024-03-15"),
        emergencyContact: "David Adams (+1 555-901-4433)",
        qualifications: "B.A. Healthcare Admin, Certified Medical Registrar",
        notes: "Front desk lead supervisor for morning outpatient queues.",
      },
      {
        employeeId: "STF-2026-002",
        userId: nurseUser?._id,
        fullName: "Arun Mary",
        email: "arun.mary@nurse.caresync.com",
        phone: "+1 (555) 234-5678",
        role: "nurse",
        department: "Cardiology",
        designation: "Senior Clinical Registered Nurse",
        shift: "Day (08:00 - 16:00)",
        status: "active",
        joinedDate: new Date("2023-08-01"),
        emergencyContact: "Thomas Mary (+1 555-888-1212)",
        qualifications: "BSN, RN, BLS/ACLS Certified",
        notes: "Assigned to Cardiology ambulatory clinic and vitals intake.",
      },
      {
        employeeId: "STF-2026-003",
        userId: labTechUser?._id,
        fullName: "Vikram Malhotra",
        email: "vikram@lab.caresync.com",
        phone: "+1 (555) 678-9012",
        role: "lab_technician",
        department: "Pathology & Laboratory",
        designation: "Senior Medical Laboratory Technician",
        shift: "Morning (07:00 - 15:00)",
        status: "active",
        joinedDate: new Date("2023-11-10"),
        emergencyContact: "Kavita Malhotra (+1 555-777-3344)",
        qualifications: "B.Sc Medical Laboratory Technology, MLT (ASCP)",
        notes: "Specialized in automated hematology & specimen accessioning.",
      },
      {
        employeeId: "STF-2026-004",
        userId: pathologistUser?._id,
        fullName: "Dr. Sunita Patil",
        email: "sunita@pathology.caresync.com",
        phone: "+1 (555) 890-1234",
        role: "pathologist",
        department: "Pathology & Laboratory",
        designation: "Consultant Clinical Pathologist",
        shift: "Day (09:00 - 17:00)",
        status: "active",
        joinedDate: new Date("2022-05-20"),
        emergencyContact: "Nikhil Patil (+1 555-444-9090)",
        qualifications: "MD (Pathology), FRCPath",
        notes: "Head of diagnostic verification and cytology reviews.",
      },
      {
        employeeId: "STF-2026-005",
        userId: pharmacyUser?._id,
        fullName: "Deepak Varma",
        email: "deepak@pharmacy.caresync.com",
        phone: "+1 (555) 345-6789",
        role: "pharmacist",
        department: "Central Pharmacy",
        designation: "Chief Pharmacist & Inventory Controller",
        shift: "Day (08:30 - 17:00)",
        status: "active",
        joinedDate: new Date("2023-01-15"),
        emergencyContact: "Sangeeta Varma (+1 555-222-1100)",
        qualifications: "Pharm.D, Registered Pharmacist (RPh)",
        notes: "Oversees formulary dispensing, narcotics cabinet, and inventory safety.",
      },
      {
        employeeId: "STF-2026-006",
        userId: billingUser?._id,
        fullName: "Meera Nair",
        email: "meera@billing.caresync.com",
        phone: "+1 (555) 456-7890",
        role: "billing_staff",
        department: "Finance & Accounts",
        designation: "Senior Billing Specialist & Cashier",
        shift: "Morning (08:00 - 16:30)",
        status: "active",
        joinedDate: new Date("2024-01-08"),
        emergencyContact: "Ramesh Nair (+1 555-333-8877)",
        qualifications: "B.Com, Certified Healthcare Financial Professional (CHFP)",
        notes: "Cashier Desk B-1 lead for invoices and payment collections.",
      },
      {
        employeeId: "STF-2026-007",
        fullName: "Karen Scott",
        email: "karen.scott@nurse.caresync.com",
        phone: "+1 (555) 890-4411",
        role: "nurse",
        department: "Pediatrics",
        designation: "Pediatric Staff Nurse",
        shift: "Evening (14:00 - 22:00)",
        status: "active",
        joinedDate: new Date("2024-06-01"),
        emergencyContact: "Mark Scott (+1 555-661-9988)",
        qualifications: "BSN, Pediatric Advanced Life Support (PALS)",
        notes: "Staff nurse in pediatric inpatient wing.",
      },
      {
        employeeId: "STF-2026-008",
        fullName: "Marcus Holloway",
        email: "marcus.holloway@reception.caresync.com",
        phone: "+1 (555) 671-8822",
        role: "receptionist",
        department: "Orthopedics",
        designation: "Desk Receptionist",
        shift: "Afternoon (12:00 - 20:00)",
        status: "active",
        joinedDate: new Date("2025-02-15"),
        emergencyContact: "Elena Holloway (+1 555-223-1199)",
        qualifications: "Associate Degree in Healthcare Management",
        notes: "Assists surgical admissions and walk-in check-in desks.",
      },
    ]);
  }

  // 40. Seed Shift Duty Schedules (NOT patient appointments)
  const scheduleCount = await Schedule.countDocuments();
  if (scheduleCount === 0) {
    console.log("Seeding staff and doctor duty rosters (administrative shifts)...");
    await Schedule.insertMany([
      {
        personName: "Dr. Rajesh Kumar",
        personType: "doctor",
        role: "Cardiologist",
        department: "Cardiology",
        shiftType: "morning",
        dayOfWeek: "Monday",
        startTime: "09:00 AM",
        endTime: "01:00 PM",
        station: "Consultation Suite 405",
        status: "active",
        notes: "Outpatient Cardiology clinic roster",
      },
      {
        personName: "Dr. Anjali Menon",
        personType: "doctor",
        role: "General Physician",
        department: "General Medicine",
        shiftType: "full_day",
        dayOfWeek: "Monday",
        startTime: "08:30 AM",
        endTime: "04:30 PM",
        station: "Consultation Room 302",
        status: "active",
        notes: "General OPD duty roster",
      },
      {
        personName: "Sarah Adams",
        personType: "staff",
        role: "Receptionist",
        department: "General Medicine",
        shiftType: "morning",
        dayOfWeek: "Monday",
        startTime: "07:30 AM",
        endTime: "03:30 PM",
        station: "Main Front Reception Desk 1",
        status: "active",
        notes: "Primary queue registration and patient check-in",
      },
      {
        personName: "Arun Mary",
        personType: "staff",
        role: "Registered Nurse",
        department: "Cardiology",
        shiftType: "morning",
        dayOfWeek: "Monday",
        startTime: "08:00 AM",
        endTime: "04:00 PM",
        station: "Vitals Triage Station A",
        status: "active",
        notes: "Pre-consultation triage and vital assessments",
      },
      {
        personName: "Vikram Malhotra",
        personType: "staff",
        role: "Lab Technician",
        department: "Pathology & Laboratory",
        shiftType: "morning",
        dayOfWeek: "Monday",
        startTime: "07:00 AM",
        endTime: "03:00 PM",
        station: "Automated Chemistry Station B",
        status: "active",
        notes: "Specimen analysis and analyzer calibration",
      },
      {
        personName: "Deepak Varma",
        personType: "staff",
        role: "Pharmacist",
        department: "Central Pharmacy",
        shiftType: "morning",
        dayOfWeek: "Monday",
        startTime: "08:30 AM",
        endTime: "05:00 PM",
        station: "Dispensing Window 1",
        status: "active",
        notes: "Prescription verification and formulary issuance",
      },
      {
        personName: "Meera Nair",
        personType: "staff",
        role: "Billing Specialist",
        department: "Finance & Accounts",
        shiftType: "morning",
        dayOfWeek: "Monday",
        startTime: "08:00 AM",
        endTime: "04:30 PM",
        station: "Ground Floor Cashier Desk 1",
        status: "active",
        notes: "Payment receipts and cashier register settlement",
      },
      {
        personName: "Dr. Priya Nair",
        personType: "doctor",
        role: "Pediatrician",
        department: "Pediatrics",
        shiftType: "afternoon",
        dayOfWeek: "Tuesday",
        startTime: "01:00 PM",
        endTime: "06:00 PM",
        station: "Pediatric Suite 201",
        status: "scheduled",
        notes: "Pediatric follow-ups and immunizations",
      },
      {
        personName: "Karen Scott",
        personType: "staff",
        role: "Nurse",
        department: "Pediatrics",
        shiftType: "evening",
        dayOfWeek: "Tuesday",
        startTime: "02:00 PM",
        endTime: "10:00 PM",
        station: "Pediatric Inpatient Station",
        status: "scheduled",
        notes: "Pediatric ward evening rounds",
      },
      {
        personName: "Dr. Vikram Rao",
        personType: "doctor",
        role: "Orthopedic Surgeon",
        department: "Orthopedics",
        shiftType: "morning",
        dayOfWeek: "Wednesday",
        startTime: "09:00 AM",
        endTime: "02:00 PM",
        station: "Surgical Suite 310",
        status: "scheduled",
        notes: "Post-op consultations and joint evaluations",
      },
    ]);
  }

  // 41. Seed Initial Server-Side Audit Logs
  const auditCount = await AuditLog.countDocuments();
  if (auditCount === 0) {
    console.log("Seeding system administrative audit logs...");
    await AuditLog.create([
      {
        actor: {
          name: "Alexander Wright",
          email: "admin@caresync.com",
          role: "admin",
        },
        action: "SYSTEM_INITIALIZATION",
        resource: "CareSync Administrative Subsystem",
        resourceType: "system",
        ipAddress: "127.0.0.1",
        userAgent: "CareSync Internal Bootstrap",
        status: "success",
        metadata: { version: "2.4.0", environment: "production" },
      },
      {
        actor: {
          name: "Alexander Wright",
          email: "admin@caresync.com",
          role: "admin",
        },
        action: "DEPARTMENTS_CONFIGURED",
        resource: "Clinical Departments (8 units)",
        resourceType: "department",
        ipAddress: "192.168.1.10",
        userAgent: "CareSync Admin Console",
        status: "success",
        metadata: { count: 8, status: "active" },
      },
      {
        actor: {
          name: "Alexander Wright",
          email: "admin@caresync.com",
          role: "admin",
        },
        action: "STAFF_ROSTER_PUBLISHED",
        resource: "Weekly Staff Shift Schedule",
        resourceType: "schedule",
        ipAddress: "192.168.1.10",
        userAgent: "CareSync Admin Console",
        status: "success",
        metadata: { shifts: 10, weekStarting: "2026-09-28" },
      },
      {
        actor: {
          name: "Alexander Wright",
          email: "admin@caresync.com",
          role: "admin",
        },
        action: "SECURITY_POLICY_CHECK",
        resource: "RBAC Authorization Enforcement",
        resourceType: "settings",
        ipAddress: "192.168.1.10",
        userAgent: "CareSync Security Engine",
        status: "success",
        metadata: { rolesEnforced: 9, mfaRequiredForAdmin: true },
      },
    ]);
  }

  // 42. Seed Admin Notifications
  if (adminUser) {
    const adminNotifCount = await Notification.countDocuments({
      recipientId: adminUser._id,
    });
    if (adminNotifCount === 0) {
      console.log("Seeding administrator notifications...");
      await Notification.create([
        {
          recipientId: adminUser._id,
          title: "System Roster Coverage Confirmed",
          message: "Weekly staff duty rosters for all 8 departments have been finalized and published.",
          type: "system",
          link: "/admin/schedules",
          isRead: false,
        },
        {
          recipientId: adminUser._id,
          title: "Scheduled Maintenance Window",
          message: "Database indexing and security audit checks scheduled for Sunday at 02:00 AM.",
          type: "system",
          link: "/admin/settings",
          isRead: false,
        },
        {
          recipientId: adminUser._id,
          title: "Security Audit Log Clean",
          message: "Automated scan verified 100% compliance with strict role separation boundaries.",
          type: "system",
          link: "/admin/audit-logs",
          isRead: true,
        },
      ]);
    }
  }

  console.log("CareSync full ecosystem including admin, staff, departments, schedules, and audit logs seeded successfully.");
  return { patientUser, patientRecord, receptionUser, nurseUser, doctorUser, labTechUser, pathologistUser, pharmacyUser, billingUser, adminUser, doctors };
}



