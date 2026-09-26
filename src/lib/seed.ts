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

  console.log("CareSync patient, receptionist, nurse, and doctor database seeded successfully.");
  return { patientUser, patientRecord, receptionUser, nurseUser, doctorUser, doctors };
}
