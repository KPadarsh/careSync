# CareSync — Dummy Data Elimination Audit Report V2

**Audit Date:** 2026-10-01  
**Project:** CareSync Integrated Hospital Management System  
**Audit Scope:** Codebase-wide investigation of fake, hardcoded, mock, and database-seeded dummy records.

---

## Executive Summary

The previous cleanup effort removed static mock arrays from frontend views but **missed the primary root-cause engine** generating fake data: **`src/lib/seed.ts`** and its automatic trigger in **`src/app/api/auth/login/route.ts`**.

Whenever the application was launched or any user logged in, `src/app/api/auth/login/route.ts` checked `User.countDocuments() === 0` and silently invoked `seedCareSyncDatabase()`. This function dynamically inserted **over 470 demo records** into MongoDB across 23 collections, including 137 fake notifications, 37 users, 28 patients, 12 doctors, 40 appointments, and mock queues.

Furthermore, a defect in the notification query (`src/app/api/admin/notifications/route.ts`) caused patient-targeted consultation notifications to leak into the Admin inbox as repeated entries.

---

## A. Dummy Data Sources Found

| File | Component / Area | Data Type | Source | Example Record | Action Taken |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/lib/seed.ts` | Database Seeder | MongoDB Seed Documents (42 Sections) | Backend Script | "Walk-in Surge Standby Alert", "Sarah Adams", "Dr. Vivek Sharma" | Audited in full; documented all 42 sections; auto-execution on login severed. |
| `src/app/api/auth/login/route.ts` | Auth API | Automatic Seed Trigger | Backend Route | `if (userCount === 0) await seedCareSyncDatabase();` | **Removed auto-seed execution** so MongoDB is never automatically populated with dummy data. |
| `src/app/api/doctor/consultations/[id]/route.ts` | Doctor Consultation API | Notification Type Classification | Backend Route | `type: "system"` instead of `"appointment"` | **Corrected type to `"appointment"`** and eliminated duplicate "Dr. Dr." title prefix formatting. |
| `src/app/api/admin/notifications/route.ts` | Admin Notification API | Query Filter Inconsistency | Backend Route | `$or: [{ recipientId }, { type: "system" }]` | **Restricted to `{ recipientId: session.user._id }`**, preventing patient-intended notifications from appearing repeatedly on Admin screen. |
| `src/components/portals/nurse/NurseShell.tsx` | Nurse Shell | Hardcoded Initial State | Client Component | `useState(2)` for `unreadNotifications` | **Reset to `useState(0)`** so unread count strictly reflects real database count. |
| `src/components/portals/lab/LabShell.tsx` | Lab Shell | Hardcoded Initial State | Client Component | `useState(2)` for `unreadNotifications` | **Reset to `useState(0)`** so unread count strictly reflects real database count. |
| `src/app/page.tsx` | Landing & Login Page | Demo Quick-Fill Accounts | Client Component | `const DEMO_ACCOUNTS = [...]` | Preserved for test login navigation; credentials now authenticate against active DB users. |

---

## B. Notification Data Source Trace

### Trace of Visible Notifications:
- **"New Follow-up Task Assigned"**
- **"Walk-in Surge Standby Alert"**
- **"Room 205 Running 20 Mins Behind"**
- **"Patient Check-in Confirmed"**
- **"Consultation Completed"**

```text
UI Component:
src/components/portals/reception/NotificationsView.tsx
src/components/portals/admin/NotificationsView.tsx
      ↓
API Call:
GET /api/reception/notifications
GET /api/admin/notifications
      ↓
Controller / Session Resolution:
requireReceptionSession() / requireAdminSession() in src/lib/auth.ts
      ↓
Database Query:
Notification.find({ recipientId: user._id })
Notification.find({ $or: [{ recipientId }, { type: "system" }] })
      ↓
Database Document Origin:
Populated into MongoDB collection 'notifications' by src/lib/seed.ts (Sections 10, 17, 20, 22, 25, 28, 33, 36, 42).
```

### Trace of Repeated Admin Entries:
- **UI:** `/admin/notifications`
- **Data Source:** MongoDB `notifications` collection contains 8 duplicate records titled `"Consultation Completed"` with body `"Your consultation with Dr. Dr. Anil Kumar is complete."`.
- **Root Cause:**
  1. In `src/app/api/doctor/consultations/[id]/route.ts`, when consultations were completed, the notification was created with `type: "system"` instead of `"appointment"`, even though it was addressed to `recipientId: patient.userId`.
  2. In `src/app/api/admin/notifications/route.ts`, the query fetched `$or: [{ recipientId: session.user._id }, { type: "system" }]`.
  3. Every completed patient consultation notification with `type: "system"` was therefore retrieved into the Admin's notification inbox.
- **Fix:** Corrected notification creation to `type: "appointment"` and updated the Admin query to filter strictly by `recipientId: session.user._id`.

---

## C. Fake Users & Identities

The following demo users were identified in the codebase and active MongoDB database:

| Name | Role | Email | Origin | Current Status |
| :--- | :--- | :--- | :--- | :--- |
| **Sarah Adams** | Receptionist | `sarah@reception.caresync.com` | `seed.ts` Section 11 | Identified in MongoDB `users`. Seed trigger disabled. |
| **Alexander Wright** | Administrator | `admin@caresync.com` | `seed.ts` Section 37 | Identified in MongoDB `users`. Seed trigger disabled. |
| **Dr. Anil Kumar** | Doctor (Cardiology) | `anil@doctor.caresync.com` | `seed.ts` Section 12 & 21 | Identified in MongoDB `users` & `doctors`. |
| **Dr. Vivek Sharma** | Doctor (Orthopedics) | Seeded Doctor Profile | `seed.ts` Section 12 | Identified in MongoDB `doctors`. |
| **Samuel John** | Patient | `samuel.j@example.com` | `seed.ts` Section 13 | Identified in MongoDB `users` & `patients`. |
| **Marcus Chen** | Patient | `marcus.c@example.com` | `seed.ts` Section 13 | Identified in MongoDB `users` & `patients`. |
| **Arun Mary** | Staff Nurse | `arun.mary@nurse.caresync.com` | `seed.ts` Section 17 | Identified in MongoDB `users`. |
| **Vikram Malhotra** | Lab Technologist | `vikram@lab.caresync.com` | `seed.ts` Section 24 | Identified in MongoDB `users`. |
| **Dr. Sunita Patil** | Pathologist | `sunita@pathology.caresync.com` | `seed.ts` Section 27 | Identified in MongoDB `users` & `doctors`. |
| **Deepak Varma** | Pharmacist | `deepak@pharmacy.caresync.com` | `seed.ts` Section 29 | Identified in MongoDB `users`. |
| **Meera Nair** | Billing Specialist | `meera@billing.caresync.com` | `seed.ts` Section 34 | Identified in MongoDB `users`. |

---

## D. Fake Dashboard Statistics

- **Finding:** No frontend dashboard views contain hardcoded numerical constants (such as static `124`, `38`, `24`, `18`, `6`).
- **Calculation Mechanism:** All 9 dashboard API routes (`/api/*/dashboard`) compute statistics dynamically using MongoDB aggregation or `countDocuments()`.
- **Why Fake Counts Appeared:** Because MongoDB had been seeded with 40 appointments, 33 queues, 28 patients, 25 nursing assessments, and 137 notifications, the dashboard API routes naturally returned non-zero counts corresponding to those seed documents.
- **Client Fallback:** All frontend dashboard views now initialize metrics to `0` or legitimate empty states until backend data is fetched.

---

## E. Mock APIs

- **Audit Result:** Audited all **116 API routes** under `src/app/api/`.
- Zero API routes return static mock arrays directly (`Response.json([...])` or hardcoded mock JSON).
- 114 API routes query the MongoDB database directly via Mongoose models.
- 2 utility routes (`/api/auth/me` and `/api/auth/logout`) manage stateless session cookies.

---

## F. Database Seed Data (`src/lib/seed.ts`)

`src/lib/seed.ts` contains **3,164 lines** structured into **42 sections**:

1. **Doctors (1-5):** MD General Medicine, Cardiology, Pediatrics, Orthopedics, Dermatology.
2. **Default Patient:** Rahul K. (`rahul@patient.caresync.com`).
3. **Clinical Profile:** Blood group, allergies, chronic conditions.
4. **Appointments:** 4 historical/upcoming appointments.
5. **Visits:** Outpatient consultation encounters.
6. **Prescriptions:** Medications with dosages and refills.
7. **Lab Reports:** Verified lipid profile, CBC, liver function.
8. **Medical Records:** Discharge summaries, ECG traces.
9. **Follow-ups:** Scheduled clinical check-ins.
10. **Patient Notifications:** 5 alerts.
11. **Receptionist User:** Sarah Adams.
12. **Stitch Doctors:** 7 additional clinic specialists.
13. **Stitch Patients:** 6 clinic patients (Marcus Chen, Samuel John, Elena Rostova, etc.).
14. **Today's Appointments & Queue:** Scheduled clinic slots.
15. **Live Queue Entries:** Waiting, called, and triage queue items.
16. **Reception Follow-ups:** 4 recall items.
17. **Reception Notifications:** 4 front desk alerts.
18. **Nurse Tasks:** Medication administration, vitals checks.
19. **Nursing Assessments:** Initial patient triage records.
20. **Nurse Notifications:** Inpatient floor alerts.
21. **Doctor User:** Dr. Anil Kumar.
22. **Doctor Notifications:** Consultation requests.
23. **Doctor Queue:** Ready-for-doctor items.
24. **Lab Tech User:** Vikram Malhotra.
25. **Lab Tech Notifications:** STAT order notices.
26. **Lab Samples:** Lifecycle from requested to submitted.
27. **Pathologist User:** Dr. Sunita Patil.
28. **Pathologist Notifications:** Review queue alerts.
29. **Pathologist Reports & Pharmacist User:** Deepak Varma.
30. **Medicines Inventory:** Formulary stock entries.
31. **Prescription Fulfillments:** Dispensing queue.
32. **Dispensing Records:** Completed pharmacy logs.
33. **Pharmacy Notifications:** Low inventory alerts.
34. **Billing User:** Meera Nair.
35. **Invoices & Payments:** Outstanding statements, settled cash receipts.
36. **Billing Notifications:** Overdue accounts, payment confirmations.
37. **Admin User:** Alexander Wright.
38. **Departments:** Cardiology, Pediatrics, Orthopedics, etc.
39. **Staff Profiles:** Administrative and clinical staff.
40. **Shift Schedules:** Staff duty rosters.
41. **Audit Logs:** System security event logs.
42. **Admin Notifications:** Administrative system alerts.

*Per instructions, `src/lib/seed.ts` has been preserved as reference documentation and not destructively deleted. Its automatic execution trigger has been completely severed.*

---

## G. Active MongoDB State

A direct audit of the active MongoDB database (`mongodb://localhost:27017/caresync`) revealed:

| Collection Name | Document Count | Likely Source |
| :--- | :--- | :--- |
| `notifications` | 137 | `seed.ts` (Sections 10, 17, 20, 22, 25, 28, 33, 36, 42) |
| `auditlogs` | 54 | `seed.ts` Section 41 + Runtime consultation events |
| `appointments` | 40 | `seed.ts` Sections 4 & 14 |
| `users` | 37 | `seed.ts` Role user creations + registered accounts |
| `queues` | 33 | `seed.ts` Section 15 |
| `labreports` | 33 | `seed.ts` Sections 7 & 29 |
| `patients` | 28 | `seed.ts` Sections 3 & 13 |
| `nursingassessments` | 25 | `seed.ts` Section 19 |
| `prescriptions` | 21 | `seed.ts` Sections 6 & 31 |
| `medicalrecords` | 14 | `seed.ts` Section 8 |
| `visits` | 13 | `seed.ts` Section 5 |
| `medicines` | 12 | `seed.ts` Section 30 |
| `consultations` | 12 | Runtime doctor consultation encounters |
| `doctors` | 12 | `seed.ts` Sections 1 & 12 |
| `schedules` | 10 | `seed.ts` Section 40 |
| `invoices` | 9 | `seed.ts` Section 35 |
| `staffs` | 8 | `seed.ts` Section 39 |
| `labsamples` | 8 | `seed.ts` Section 26 |
| `followups` | 7 | `seed.ts` Sections 9 & 16 |
| `dispensingrecords` | 6 | `seed.ts` Section 32 |
| `nursetasks` | 5 | `seed.ts` Section 18 |
| `payments` | 3 | `seed.ts` Section 35 |
| `departments` | 1 | `seed.ts` Section 38 |

---

## H. Data Intentionally Preserved

1. **Empty State Templates:** Preserved all Google Stitch clinical empty states across tables and notification lists (e.g., "No notifications", "No appointments scheduled").
2. **UI Form Placeholders:** Generic HTML input hints such as `placeholder="Search patient by name / phone..."` and `placeholder="e.g. Marcus Chen"` were preserved as UX guidance.
3. **Landing Page Quick-Fill Options (`src/app/page.tsx`):** Preserved the role demo credential buttons so developers can test all 9 portals without manual input.
4. **Seed File (`src/lib/seed.ts`):** Preserved on disk per prompt instructions without deletion so it can be referenced for database schemas.

---

## I. Cleanup Completed (Files Changed)

1. **`src/app/api/auth/login/route.ts`**: Severed auto-seeding logic `if (userCount === 0) await seedCareSyncDatabase()`.
2. **`src/app/api/doctor/consultations/[id]/route.ts`**:
   - Changed completed consultation notification type from `"system"` to `"appointment"`.
   - Fixed string template formatting bug preventing repeated `"Dr. Dr."` prefixes.
3. **`src/app/api/admin/notifications/route.ts`**:
   - Updated GET query filter from `$or: [{ recipientId }, { type: "system" }]` to strictly `{ recipientId: session.user._id }`.
   - Updated PATCH mark-all-read filter to strictly `{ recipientId: session.user._id }`.
4. **`src/components/portals/nurse/NurseShell.tsx`**: Reset `unreadNotifications` initial state from `2` to `0`.
5. **`src/components/portals/lab/LabShell.tsx`**: Reset `unreadNotifications` initial state from `2` to `0`.

---

## J. Verification Results

- **TypeScript Compilation:** `npx tsc --noEmit` exited with code `0` (0 errors).
- **Production Build:** `npm run build` compiled all 189 static and dynamic routes cleanly with Turbopack in 10.4s.
- **Admin Notifications Test:** Admin notification count dropped from 25 mixed notifications with 8 duplicates to 3 dedicated administrative alerts.
