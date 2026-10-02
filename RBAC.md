# CareSync — Role-Based Access Control (RBAC) Architecture (Phase 4)

## Overview
CareSync enforces a multi-tier, server-authoritative Role-Based Access Control (RBAC) model. 

The security architecture operates on a fundamental distinction:
- **Authentication**: *Who are you?* (Verified by cryptographic session tokens tied to the MongoDB `User` and `Session` collections).
- **Authorization**: *What are you allowed to do?* (Strictly governed by server-side role boundaries, centralized permission maps, and resource ownership assertions).

The browser and client applications are never trusted to provide or assert role identity. The authoritative source of truth for user role identity is `User.role` stored in MongoDB.

---

## 1. Supported Roles

CareSync strictly supports nine distinct system roles:

| Role Name | Normalized Key | Domain Focus |
| :--- | :--- | :--- |
| **Administrator** | `ADMIN` | System, staff, doctor, department, schedule, and audit configuration |
| **Receptionist** | `RECEPTIONIST` | Patient intake, registration, scheduling, and queue coordination |
| **Nurse** | `NURSE` | Triage, vitals recording, and nursing care assessments |
| **Doctor** | `DOCTOR` | Clinical encounters, diagnoses, prescriptions, and lab orders |
| **Lab Technician** | `LAB_TECHNICIAN` | Phlebotomy tracking, sample accessioning, testing, and result entry |
| **Pathologist** | `PATHOLOGIST` | Diagnostic review, microscopic interpretation, and report certification |
| **Pharmacist** | `PHARMACIST` | Prescription verification, formulary inventory, and dispensing |
| **Billing Staff** | `BILLING_STAFF` | Invoicing, payments, and financial ledger management |
| **Patient** | `PATIENT` | Self-service access restricted exclusively to own health data |

---

## 2. Centralized Granular Permissions

All permissions are centralized in `src/lib/permissions.ts` and categorized into functional groups:

### 2.1 Staff Management
- `staff.view`
- `staff.create`
- `staff.update`
- `staff.activate`
- `staff.deactivate`

### 2.2 Doctor Administration
- `doctor.view`
- `doctor.create`
- `doctor.update`
- `doctor.activate`
- `doctor.deactivate`

### 2.3 Department Administration
- `department.view`
- `department.create`
- `department.update`
- `department.activate`
- `department.deactivate`

### 2.4 Schedule Management
- `schedule.view`
- `schedule.create`
- `schedule.update`
- `schedule.delete`

### 2.5 User Administration
- `user.view`
- `user.update`
- `user.activate`
- `user.deactivate`

### 2.6 Patients
- `patient.view`
- `patient.create`
- `patient.update`

### 2.7 Appointments
- `appointment.view`
- `appointment.create`
- `appointment.update`
- `appointment.cancel`
- `appointment.checkin`

### 2.8 Queue
- `queue.view`
- `queue.update`

### 2.9 Nursing & Vitals
- `vitals.view`
- `vitals.create`
- `nursingAssessment.view`
- `nursingAssessment.create`
- `nursingAssessment.update`
- `nursingRecord.view`

### 2.10 Consultations
- `consultation.view`
- `consultation.create`
- `consultation.update`

### 2.11 Prescriptions
- `prescription.view`
- `prescription.create`
*(Doctor authors and owns prescriptions; Pharmacist has NO prescription.update)*

### 2.12 Laboratory
- `labRequest.view`
- `labRequest.create`
- `labSample.view`
- `labSample.create`
- `labSample.update`
- `labResult.view`
- `labResult.create`
- `labResult.update`
- `labResult.submit`

### 2.13 Pathology
- `pathologyReport.view`
- `pathologyReport.review`
- `pathologyReport.verify`

### 2.14 Pharmacy & Inventory
- `pharmacyPrescription.view`
- `dispensing.view`
- `dispensing.create`
- `medicine.view`
- `medicine.create`
- `medicine.update`

### 2.15 Billing & Payments
- `invoice.view`
- `invoice.create`
- `invoice.update`
- `payment.view`
- `payment.create`
- `billingHistory.view`
- `outstanding.view`
*(CareSync is an outpatient clinic; strictly NO discharge permissions)*

### 2.16 Notifications & Auditing
- `notification.view`
- `notification.markRead`
- `auditLog.view`

---

## 3. Role-to-Permission Mapping

```text
ADMIN:
  staff.view, staff.create, staff.update, staff.activate, staff.deactivate
  doctor.view, doctor.create, doctor.update, doctor.activate, doctor.deactivate
  department.view, department.create, department.update, department.activate, department.deactivate
  schedule.view, schedule.create, schedule.update, schedule.delete
  user.view, user.update, user.activate, user.deactivate
  auditLog.view
  notification.view, notification.markRead

RECEPTIONIST:
  patient.view, patient.create, patient.update
  appointment.view, appointment.create, appointment.update, appointment.cancel, appointment.checkin
  queue.view
  doctor.view, department.view, schedule.view
  notification.view, notification.markRead

NURSE:
  patient.view
  queue.view, queue.update
  vitals.view, vitals.create
  nursingAssessment.view, nursingAssessment.create, nursingAssessment.update
  nursingRecord.view
  notification.view, notification.markRead

DOCTOR:
  patient.view
  queue.view, queue.update
  consultation.view, consultation.create, consultation.update
  prescription.view, prescription.create
  labRequest.view, labRequest.create
  labResult.view, pathologyReport.view
  vitals.view, nursingAssessment.view, nursingRecord.view
  appointment.view, doctor.view, schedule.view
  notification.view, notification.markRead

LAB_TECHNICIAN:
  labRequest.view
  labSample.view, labSample.create, labSample.update
  labResult.view, labResult.create, labResult.update, labResult.submit
  notification.view, notification.markRead

PATHOLOGIST:
  labRequest.view, labSample.view, labResult.view
  pathologyReport.view, pathologyReport.review, pathologyReport.verify
  patient.view
  notification.view, notification.markRead

PHARMACIST:
  pharmacyPrescription.view
  dispensing.view, dispensing.create
  medicine.view, medicine.create, medicine.update
  notification.view, notification.markRead

BILLING_STAFF:
  invoice.view, invoice.create, invoice.update
  payment.view, payment.create
  billingHistory.view, outstanding.view
  patient.view
  notification.view, notification.markRead

PATIENT:
  patient.view, patient.update (own)
  appointment.view, appointment.create, appointment.cancel (own)
  prescription.view (own)
  labResult.view, pathologyReport.view (own)
  consultation.view, vitals.view (own)
  notification.view, notification.markRead (own)
```

---

## 4. Protected Portal Routes

Client navigation across portal prefixes is guarded at the network edge by [`src/middleware.ts`](file:///c:/my-react-works/CareSync/src/middleware.ts):

| Portal Prefix | Required Role | Unauthenticated Response | Unauthorized Response |
| :--- | :--- | :--- | :--- |
| `/admin/*` | `ADMIN` | Redirect to `/?redirect=...` | Redirect to `/unauthorized` |
| `/reception/*` | `RECEPTIONIST` | Redirect to `/?redirect=...` | Redirect to `/unauthorized` |
| `/nurse/*` | `NURSE` | Redirect to `/?redirect=...` | Redirect to `/unauthorized` |
| `/doctor/*` | `DOCTOR` | Redirect to `/?redirect=...` | Redirect to `/unauthorized` |
| `/lab/*` | `LAB_TECHNICIAN` | Redirect to `/?redirect=...` | Redirect to `/unauthorized` |
| `/pathologist/*` | `PATHOLOGIST` | Redirect to `/?redirect=...` | Redirect to `/unauthorized` |
| `/pharmacy/*` | `PHARMACIST` | Redirect to `/?redirect=...` | Redirect to `/unauthorized` |
| `/billing/*` | `BILLING_STAFF` | Redirect to `/?redirect=...` | Redirect to `/unauthorized` |
| `/patient/*` | `PATIENT` | Redirect to `/?redirect=...` | Redirect to `/unauthorized` |

---

## 5. Server-Side API Security & Execution Hierarchy

Every protected API endpoint independently authenticates and authorizes requests using server-side guards:

```text
Incoming API Request
       ↓
1. Authentication: Read HTTP-only cookie, hash session token, find active Session in MongoDB
       ↓ (Unauthenticated -> 401 Unauthorized)
2. Resolve User: Find User by session.userId, verify User.status === "ACTIVE"
       ↓ (Inactive / Suspended -> 403 Forbidden)
3. Authorization: Read User.role, evaluate against required permissions via requirePermission()
       ↓ (Insufficient Permission -> 403 Forbidden)
4. Resource Ownership: Enforce assertPatientOwnership() or server-derived doctor/staff identity
       ↓ (Unauthorized Access to Foreign Record -> 403 Forbidden)
5. Input Validation: Validate payload schema (types, formats, constraints)
       ↓ (Invalid -> 400 Bad Request)
6. Business Service Execution: Call database service
       ↓
7. Return Safe JSON Response
```

---

## 6. Critical Security Boundaries & Special Restrictions

1. **ADMIN is NOT All-Powerful**:
   Administrative permissions are strictly separated from clinical operations. Admin accounts cannot create consultations, author prescriptions, verify pathology reports, dispense medications, process billing payments, or record nursing assessments.
2. **Pharmacist CANNOT Edit Prescriptions**:
   The doctor authors and owns the prescription (`prescription.create`). The pharmacist views the prescription (`pharmacyPrescription.view`) and dispenses medication (`dispensing.create`). If there is an issue with a prescription, clarification must be requested from the prescribing doctor. No `prescription.update` permission exists for pharmacists.
3. **Lab Technician CANNOT Verify Pathology**:
   A Lab Technician processes wet-bench samples and submits analyzer results (`labResult.submit`). Only a licensed Pathologist can review diagnostic interpretations and certify reports (`pathologyReport.verify`).
4. **Billing Has Strictly NO Discharge Workflow**:
   CareSync is an outpatient ambulatory clinic. No discharge status, discharge summary, or discharge criteria exist in billing permissions or data models.
5. **Patient Ownership**:
   Patients cannot browse other patients' records. Any query for appointments, prescriptions, vitals, or lab results enforces `patientId: session.patientId`.
6. **No Client Role Trust**:
   Never trust `body.role`, `query.role`, `localStorage.role`, or `sessionStorage.role`. Roles are obtained exclusively from MongoDB `User.role`.
