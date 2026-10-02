# CareSync — Dummy Data & Frontend Cleanup Audit Report

**Phase:** Phase 1 — Remove Dummy Data & Prepare for Real Backend  
**Date:** October 2026  
**Status:** Completed & Validated

---

## 1. Executive Summary

This audit catalogs and documents all dummy, mock, temporary persona names, fake dashboard statistics, simulated API responses (`setTimeout`), hardcoded table records, and fallback dummy strings embedded across the CareSync codebase.

The CareSync frontend previously utilized mock arrays, hardcoded persona identities (such as "Sarah Jenkins", "Dr. Anil Kumar", "Deepak Varma", "Sister Priya Nair", "Meera Nair", "Vikram Malhotra", "Dr. Sunita Patil", "Rahul Sharma", and "Dr. Anjali Menon"), and initial clinical form states to make Stitch UI screens appear populated during initial UI prototyping.

In this Phase 1 cleanup:
- All fake records and mock arrays were replaced with clean data boundaries and empty states.
- All fake dashboard statistics were replaced with zeros or clean indicators.
- All hardcoded logged-in user personas across all 9 portal shells were decoupled and connected to dynamic session consumption (`useCurrentUser` / `/api/auth/me`).
- Simulated API successes (`setTimeout`) were eliminated; operations that lack real backend routes now transparently report their pending status.
- TypeScript compilation (`npx tsc --noEmit`) and production Next.js build (`next build`) pass with 0 errors across all 189 routes and pages.

---

## 2. Removed

The following dummy data, mock arrays, simulated responses, and hardcoded personas have been completely removed from UI components, pages, and API routes:

### 2.1 Hardcoded Logged-in User Personas in Portal Shells
- **Reception Portal (`ReceptionShell.tsx`):** Removed static `name: "Sarah Jenkins"`, role `"Front Desk Lead • Station 01"`, and avatar. Connected to dynamic hook with `"Front Desk Staff"` fallback.
- **Billing Portal (`BillingShell.tsx`):** Removed static `name: "Meera Nair"`, role `"Lead Billing & Financial Counselor"`, and avatar. Connected to dynamic hook with `"Billing Staff"` fallback.
- **Patient Portal (`PatientShell.tsx`):** Removed static `name: "Rahul Sharma"`, role `"MRN-2026-00001 • Primary Account"`, and avatar. Connected to dynamic hook with `"Patient"` fallback.
- **Pharmacy Portal (`PharmacyShell.tsx`):** Removed static `name: "Deepak Varma, RPh"`, role `"Chief Clinical Pharmacist • Lic #PH-8841"`, and avatar. Connected to dynamic hook with `"Pharmacist"` fallback.
- **Nurse Portal (`NurseShell.tsx`):** Removed static `name: "Sister Priya Nair, RN"`, role `"Charge Nurse • Triage Station 01"`, and avatar. Connected to dynamic hook with `"Staff Nurse"` fallback.
- **Pathologist Portal (`PathologistShell.tsx`):** Removed static `name: "Dr. Sunita Patil, MD"`, role `"Chief of Diagnostic Pathology • Cert #PATH-9902"`, and avatar. Connected to dynamic hook with `"Pathologist"` fallback.
- **Doctor Portal (`DoctorShell.tsx`):** Removed static `name: "Dr. Anil Kumar, MD"`, role `"Lead Consultant Cardiologist • Dept of Medicine"`, badge counts initialized to `0`, and avatar. Connected to dynamic profile with `"Doctor"` fallback.
- **Lab Portal (`LabShell.tsx`):** Removed static `name: "Vikram Malhotra"`, role `"Lead Medical Technologist • Central Diagnostic Lab"`, and avatar. Connected to dynamic hook with `"Lab Technician"` fallback.
- **Admin Portal (`AdminShell.tsx`):** Removed static `name: "Alexander Wright"`, role `"Hospital Operations Administrator • Full Access"`, badge counts initialized to `0`, and avatar. Connected to dynamic hook with `"Administrator"` fallback.

### 2.2 Patient Portal Mock Data & Hardcoded Fallbacks
- **`PatientStats.tsx`:** Removed fake counts (2 upcoming appointments, 1 active prescription, 3 lab reports, $1,250 billing balance). Replaced with zeros (`0`, `0`, `0`, `"$0"`).
- **`HealthProfileCard.tsx`:** Removed hardcoded defaults (`"O+"`, `"32 Years"`, `"Aug 15, 2023"`, `"Dr. Anjali Menon"`, Unsplash image). Replaced with clean empty indicators (`"—"`, `"Unassigned"`).
- **`UpcomingAppointmentCard.tsx`:** Removed default doctor fallback (`"Dr. Anjali Menon"`, Google image). Added a dedicated empty state banner when no appointment is scheduled.
- **`RecentActivityFeed.tsx`:** Removed `defaultActivities` array of mock patient timeline events. Now accepts typed props with clean empty state.
- **`MessagesView.tsx`:** Removed `threads` array of fake clinician chat threads and fake chat bubble messages. Replaced with clean empty state and real message-dispatch indicator.
- **`ProfileView.tsx` (Patient):** Removed `"Dr. Anjali Menon"` fallback; uses `"Unassigned"`.

### 2.3 Clinical & Nursing Portal Mock Data
- **`NursingAssessmentView.tsx`:** Removed hardcoded initial pre-filled form fields (chief complaint `"Mild headache..."`, symptoms array, pain score `3`, pain location `"Mid-sternal"`, observations `"Patient alert..."`, doctor handoff notes). Initial state is now completely empty.
- **`NursingRecordDetailView.tsx`:** Removed fallback `"Arun Mary, RN"`. Replaced with `"Staff Nurse"`.
- **`NursingRecordsView.tsx`:** Removed fallback `"Arun Mary, RN"`. Replaced with `"Staff Nurse"`.
- **`PatientOverviewView.tsx`:** Removed fallback `"Arun Mary, RN"`. Replaced with `"Staff Nurse"`.
- **`ProfileView.tsx` (Nurse):** Removed `"AM"` and fallback `"Arun Mary"`. Replaced with dynamic initials and `"Staff Nurse"`.
- **`VitalsRecordingView.tsx`:** Removed static text `"• Recorded today by Arun Mary, RN"`. Replaced hardcoded fallback numbers (`120/80`, `72`, `98.6`, `98%`, `16`) with empty indicators (`"—"`).

### 2.4 Doctor Portal Mock Data
- **`ActiveConsultationView.tsx`:** Removed `"Dr. Anil Kumar"` from follow-up input placeholder and certification sign-off text. Removed fake vitals defaults (`120/80`, `72`, `98%`, `98.6`, `18`) in the triage ribbon; now displays clean `"—"` when vitals have not been recorded by nursing.
- **`DashboardView.tsx` (Doctor):** Removed `"Dr. Anil Kumar"` and `"Room 302"` fallback in header banner. Replaced with dynamic doctor name and `"Consultation Room"`.
- **`ProfileView.tsx` (Doctor):** Removed `"Dr. Anil Kumar"` fallback. Replaced with `"Doctor"`.

### 2.5 Billing Portal Mock Data
- **`CreateInvoiceView.tsx`:** Removed prefilled line item (`"Specialist Physician Consultation"`, `$180`). Form now initializes with an empty line.
- **`ProfileView.tsx` (Billing):** Removed hardcoded `"MN"`, `"Meera Nair"`, and demo email. Replaced with dynamic initials and `"Billing Specialist"`.

### 2.6 Lab & Pathology Mock Data
- **`CompletedView.tsx` (Lab):** Removed `"Dr. Sunita Patil, MD"` and `"Vikram Malhotra, MLT"` fallbacks.
- **`ProfileView.tsx` (Lab):** Removed hardcoded `"VM"` avatar initials. Replaced with dynamic initials from `profile.name`.
- **`RequestDetailView.tsx` & `TestDetailView.tsx` (Lab):** Removed `"Dr. Sunita Patil"` and `"Vikram Malhotra"`.
- **`DashboardView.tsx` (Pathologist):** Removed `"Certified sign-off bench for Dr. Sunita Patil, MD"`.
- **`ProfileView.tsx` (Pathologist):** Removed hardcoded `"SP"` initials. Replaced with dynamic initials.
- **`ReportReviewView.tsx` (Pathologist):** Removed `"Dr. Anil Kumar"` from placeholder and `"Dr. Sunita Patil, MD"` from the legal medical verification modal.
- **Page Metadata (`(dashboard)/lab/completed/page.tsx`, `lab/profile/page.tsx`, `pathologist/profile/page.tsx`):** Removed `"Dr. Sunita Patil, MD"` and `"Vikram Malhotra, MLT"` from title and meta descriptions.

### 2.7 Admin Portal Mock Data
- **`CreateStaffView.tsx`:** Removed `"Arun Mary"` and `"arun.mary@nurse.caresync.com"` from placeholders.
- **`ProfileView.tsx` (Admin):** Removed hardcoded `"AW"`, `"Alexander Wright"`, `"admin@caresync.com"`, and fake metrics (`8`, `5`, `8`, `12`). Default metrics are now `0`.

### 2.8 Authentication Page Mock Data & Simulated API Calls
- **`src/app/page.tsx`:** Removed pre-filled credentials (`"vikram@lab.caresync.com"`, `"Password123!"`); initialized form state to `""`.
- **`handleForgotPassword` in `src/app/page.tsx`:** Removed fake `setTimeout` that claimed an email was dispatched. Now truthfully informs the user that password recovery is pending backend integration.

### 2.9 Mongoose Models Hardcoded Schema Defaults
- **`src/models/DispensingRecord.ts`:** Removed `default: "Deepak Varma, RPh"`; changed to `default: "Pharmacist"`.
- **`src/models/LabSample.ts`:** Removed `default: "Vikram Malhotra, MLT"`; changed to `default: "Lab Technician"`.
- **`src/models/Invoice.ts`:** Removed `default: "Meera Nair, Billing Specialist"`; changed to `default: "Billing Specialist"`.
- **`src/models/Payment.ts`:** Removed `default: "Meera Nair, Billing Specialist"`; changed to `default: "Billing Specialist"`.
- **`src/models/LabReport.ts`:** Removed `default: "Dr. Sunita Patil, MD Pathology"` from `verifiedBy`.

### 2.10 API Route Hardcoded Fallback Strings
Removed all instances where API routes injected fake persona names into returned JSON payloads:
- `src/app/api/billing/invoices/route.ts` & `payments/route.ts`: Removed `"Meera Nair"`.
- `src/app/api/doctor/consultations/[id]/route.ts`: Removed fake vitals object and `"Arun Mary, RN"` default.
- `src/app/api/doctor/lab/route.ts` & `[id]/route.ts`: Removed fake age `32`, fake blood group `"O+"`, and `"Dr. Sunita Patil"`.
- `src/app/api/lab/tests/route.ts` & `[id]/route.ts`: Removed `"Dr. Anil Kumar"`, `"Vikram Malhotra"`, and `"Dr. Sunita Patil"`.
- `src/app/api/lab/samples/route.ts` & `[id]/route.ts`: Removed `"Dr. Anil Kumar"` and `"Vikram Malhotra"`.
- `src/app/api/lab/requests/route.ts` & `[id]/route.ts`: Removed `"Dr. Anil Kumar"`, `"Vikram Malhotra"`, and `"Dr. Sunita Patil"`.
- `src/app/api/lab/dashboard/route.ts`: Removed `"Dr. Anil Kumar"` and `"Vikram Malhotra"`.
- `src/app/api/lab/completed/route.ts`: Removed `"Dr. Anil Kumar"` and `"Vikram Malhotra"`.
- `src/app/api/patient/dashboard/route.ts`: Removed `"Dr. Anjali Menon"` and `"O+"` fallback.
- `src/app/api/pharmacy/dispensing/route.ts`, `dispensing/[id]/route.ts`, `prescriptions/[id]/route.ts`: Removed `"Deepak Varma"`.
- `src/app/api/pathologist/settings/route.ts`: Made digital signature stamp dynamic using `session.user.name`.

---

## 3. Preserved

The following foundational code, assets, and configurations have been intentionally preserved:

1. **MongoDB Database Connection (`src/lib/db.ts`):** Cached connection handler connecting to `process.env.MONGODB_URI` preserved intact.
2. **Existing User Model (`src/models/User.ts`):** Preserved intact with bcrypt/scrypt compatibility and role definitions.
3. **All 16 Existing Domain Models (`src/models/*`):** Retained complete schemas for `Patient`, `Doctor`, `Appointment`, `Queue`, `NursingAssessment`, `NurseTask`, `Consultation`, `Prescription`, `LabReport`, `LabSample`, `Medicine`, `DispensingRecord`, `Invoice`, `Payment`, `AuditLog`, and `Notification`.
4. **Database Seeding Engine (`src/lib/seed.ts`):** Intentionally preserved as an offline utility for database initialization in local/staging environments.
5. **Session & Security Infrastructure (`src/lib/auth.ts`):** Preserved session token encryption, cookie parsing, and role-based guards.
6. **Complete UI Design & Stitch Layouts:** 100% of all styling, Tailwind CSS tokens, icons, headers, navigation sidebars, forms, tables, modals, and responsive breakpoints are preserved.
7. **All 189 Next.js App Routes:** No pages, endpoints, or features were removed.

---

## 4. Prepared for API

The following component boundaries have been refactored to consume dynamic backend data:

1. **`src/hooks/useCurrentUser.ts`:**
   - Created a central React hook that queries `/api/auth/me` on mount.
   - Provides `{ user, loading, error }` state to all portal shells with zero UI flash.
2. **Portal Navigation Shells (9/9):**
   - Refactored `ReceptionShell`, `BillingShell`, `DoctorShell`, `LabShell`, `NurseShell`, `PathologistShell`, `PatientShell`, `PharmacyShell`, and `AdminShell` to use `useCurrentUser`.
   - Sidebar badges now show real counts or neutral zero states (`0`).
3. **Patient Portal Dashboard:**
   - Prepared `PatientStats`, `HealthProfileCard`, `UpcomingAppointmentCard`, and `RecentActivityFeed` with explicit `{ loading, data, empty, error }` states.
4. **Clinical & Nursing Forms:**
   - `NursingAssessmentView` and `VitalsRecordingView` now accept clean props from their respective API endpoints without hardcoded default values.
5. **Doctor Consultation Workspace:**
   - `ActiveConsultationView` displays real nursing triage vitals when present, and clean `"—"` indicators when absent.
6. **Billing & Invoicing Workflow:**
   - `CreateInvoiceView` is ready to submit dynamic line items to `POST /api/billing/invoices`.
7. **Lab & Pathology Review Workflow:**
   - `TestDetailView`, `CompletedView`, and `ReportReviewView` are prepared to bind directly to `LabReport` and `LabSample` records.

---

## 5. Remaining Temporary Code

The following items remain temporarily in the project and will be addressed in subsequent phases:

1. **`DEMO_ACCOUNTS` in `src/app/page.tsx`:**
   - **Reason:** Provides convenient autofill buttons on the login screen for testing each role during development. The form itself starts with blank input fields (`""`), but the demo buttons remain until the full authentication and session management phase is integrated.
2. **Database Seeding Script (`src/lib/seed.ts`):**
   - **Reason:** Required for seeding initial reference data (departments, medicine formulary) when setting up clean database environments.
3. **Test Database Route Status:**
   - **Finding:** Verified that `src/app/api/test-db/route.ts` does not exist in the repository. Database connection verification is performed directly by existing API routes.

---

## 6. Next Phase

**Database Foundation + User/Staff/Doctor/Patient Models**
