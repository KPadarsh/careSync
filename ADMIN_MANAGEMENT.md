# CareSync — Admin Staff & Doctor Management (Phase 5)

## 1. Overview & Architecture

Phase 5 implements real administrative management of hospital personnel (Staff) and physicians (Doctors) within CareSync, backed by MongoDB Atlas, Mongoose schemas, thin Next.js App Router API endpoints, and centralized services.

### Core Architectural Principles
- **Thin Route Handlers**: API routes (`/api/admin/staff/*` and `/api/admin/doctors/*`) strictly handle authentication via `requirePermission`, parse inputs, delegate to service methods, and return safe JSON responses.
- **Service Layer**: All business rules, ID generation, validation, bidirectional user-profile linking, audit logging, and transactional rollback live in `StaffService` (`src/services/staff.service.ts`) and `DoctorService` (`src/services/doctor.service.ts`).
- **Server-Side Identity**: The authenticated user's role and identity are strictly derived from the database session and server-side `User.role`. Client-submitted roles are never trusted.
- **Zero Mock / Fake Data**: All views, search queries, and detail pages are driven by real MongoDB collections. Empty collections display clear empty states without fake demo accounts or mock arrays.

---

## 2. Staff Management

### 2.1 Allowed Staff Roles
Staff creation is strictly restricted to legitimate non-admin, non-doctor hospital personnel roles:
- `RECEPTIONIST`
- `NURSE`
- `LAB_TECHNICIAN`
- `PATHOLOGIST`
- `PHARMACIST`
- `BILLING_STAFF`

> **Security Rule**: Any attempt to provision an `ADMIN`, `DOCTOR`, or `PATIENT` account via Staff Management is rejected immediately with HTTP 400 Bad Request.

### 2.2 Staff Creation Workflow
```text
Admin Client (POST /api/admin/staff)
       │
       ▼
requirePermission("staff.create")
       │
       ▼
StaffService.createStaff(input, actor)
  ├── 1. Validate input via CreateStaffSchema (Zod)
  ├── 2. Verify role in ALLOWED_STAFF_ROLES
  ├── 3. Verify email uniqueness in User & Staff collections (409 Conflict if duplicate)
  ├── 4. Generate collision-safe sequential Employee ID (STF-YYYY-XXX)
  ├── 5. Create User authentication identity (scrypt passwordHash, status: "ACTIVE")
  ├── 6. Create Staff profile document (userId: User._id)
  ├── 7. Link User.profileId = Staff._id & User.profileType = "Staff"
  └── 8. Log audit event STAFF_CREATED
       │
       ▼
Safe Response (HTTP 201) — excludes password, passwordHash, and session tokens
```

#### Rollback Guarantee
If an error occurs during Staff profile creation or linking:
- Explicit rollback executes: `await User.deleteOne({ _id: createdUser._id })`
- Guarantees zero orphaned `User` accounts in MongoDB.

### 2.3 Staff Activation & Deactivation
- **Activate Staff** (`POST /api/admin/staff/[id]/activate` or `PATCH /api/admin/staff/[id]` with `status: "ACTIVE"`):
  - Requires permission: `staff.activate`
  - Sets `Staff.status = "ACTIVE"`
  - Synchronizes linked `User.status = "ACTIVE"`
  - Writes audit log `STAFF_ACTIVATED`
- **Deactivate Staff** (`POST /api/admin/staff/[id]/deactivate` or `PATCH /api/admin/staff/[id]` with `status: "INACTIVE"`):
  - Requires permission: `staff.deactivate`
  - Sets `Staff.status = "INACTIVE"`
  - Synchronizes linked `User.status = "INACTIVE"`
  - Revokes active sessions immediately: `Session.deleteMany({ userId: staff.userId })`
  - Prevents login according to Phase 3 authentication checks (`status === "ACTIVE"`)
  - Writes audit log `STAFF_DEACTIVATED`

### 2.4 Staff Update
- Requires permission: `staff.update`
- Permitted update fields: `fullName`, `phone`, `department`, `departmentId`, `designation`, `shift`, `emergencyContact`, `qualifications`, `notes`, `status`.
- Immutable fields protected: `_id`, `userId`, `employeeId`, `email`, `role`, `passwordHash`.
- Synchronizes `User.name` when `fullName` changes.

---

## 3. Doctor Management

### 3.1 Doctor Creation Workflow
```text
Admin Client (POST /api/admin/doctors)
       │
       ▼
requirePermission("doctor.create")
       │
       ▼
DoctorService.createDoctor(input, actor)
  ├── 1. Validate input via CreateDoctorSchema (Zod)
  ├── 2. Verify email uniqueness in User & Doctor collections (409 Conflict if duplicate)
  ├── 3. Verify licenseNumber uniqueness if provided (409 Conflict if duplicate)
  ├── 4. Generate collision-safe Doctor ID (DOC-YYYY-XXX) & fallback licenseNumber
  ├── 5. Create User authentication identity (role: "DOCTOR", scrypt hash, status: "ACTIVE")
  ├── 6. Create Doctor profile document (userId: User._id)
  ├── 7. Link User.profileId = Doctor._id & User.profileType = "Doctor"
  └── 8. Log audit event DOCTOR_CREATED
       │
       ▼
Safe Response (HTTP 201) — excludes password, passwordHash, and session tokens
```

#### Rollback Guarantee
If an error occurs during Doctor profile creation or linking:
- Explicit rollback executes: `await User.deleteOne({ _id: createdUser._id })`
- Guarantees zero orphaned `User` accounts.

### 3.2 Doctor Activation & Deactivation
- **Activate Doctor** (`POST /api/admin/doctors/[id]/activate` or `PATCH /api/admin/doctors/[id]` with `status: "ACTIVE"`):
  - Requires permission: `doctor.activate`
  - Sets `Doctor.status = "ACTIVE"`
  - Synchronizes linked `User.status = "ACTIVE"`
  - Writes audit log `DOCTOR_ACTIVATED`
- **Deactivate Doctor** (`POST /api/admin/doctors/[id]/deactivate` or `PATCH /api/admin/doctors/[id]` with `status: "INACTIVE"`):
  - Requires permission: `doctor.deactivate`
  - Sets `Doctor.status = "INACTIVE"`
  - Synchronizes linked `User.status = "INACTIVE"`
  - Revokes active sessions immediately: `Session.deleteMany({ userId: doctor.userId })`
  - Writes audit log `DOCTOR_DEACTIVATED`

### 3.3 Doctor Update
- Requires permission: `doctor.update`
- Permitted update fields: `name`, `specialty`, `specialization`, `department`, `departmentId`, `qualification`, `roomNumber`, `licenseNumber` (verified unique), `phone`, `consultationFee`, `availableDays`, `workingHours`, `slotDurationMinutes`, `status`.
- Immutable fields protected: `_id`, `userId`, `doctorId`, `email`, `passwordHash`.
- Synchronizes `User.name` when `name` changes.

---

## 4. API Endpoints Reference

| Method | Endpoint | Permission Required | Description |
|---|---|---|---|
| `GET` | `/api/admin/staff` | `staff.view` | List staff with filtering (`search`, `role`, `department`, `status`, pagination) |
| `POST` | `/api/admin/staff` | `staff.create` | Provision new staff account and profile with rollback protection |
| `GET` | `/api/admin/staff/[id]` | `staff.view` | Retrieve staff details and linked user identity |
| `PATCH` | `/api/admin/staff/[id]` | `staff.update` / `activate` / `deactivate` | Update permitted profile fields or status |
| `POST` | `/api/admin/staff/[id]/activate` | `staff.activate` | Activate staff profile and User account |
| `POST` | `/api/admin/staff/[id]/deactivate` | `staff.deactivate` | Deactivate staff profile and revoke User sessions |
| `GET` | `/api/admin/doctors` | `doctor.view` | List physicians with filtering (`search`, `department`, `specialty`, `status`, pagination) |
| `POST` | `/api/admin/doctors` | `doctor.create` | Provision new physician account and profile with rollback protection |
| `GET` | `/api/admin/doctors/[id]` | `doctor.view` | Retrieve physician details and linked user identity |
| `PATCH` | `/api/admin/doctors/[id]` | `doctor.update` / `activate` / `deactivate` | Update permitted physician fields or status |
| `POST` | `/api/admin/doctors/[id]/activate` | `doctor.activate` | Activate physician profile and User account |
| `POST` | `/api/admin/doctors/[id]/deactivate` | `doctor.deactivate` | Deactivate physician profile and revoke User sessions |

---

## 5. Error Categories & Status Codes

- **HTTP 401 Unauthorized**: No active session or expired token.
- **HTTP 403 Forbidden**: Active session lacks required RBAC permission.
- **HTTP 400 Bad Request**: Input validation failed (invalid email format, invalid role, disallowed field change).
- **HTTP 404 Not Found**: Staff or Doctor identifier does not exist.
- **HTTP 409 Conflict**: Duplicate email across User/Staff/Doctor, or duplicate physician license number.
- **HTTP 500 Internal Server Error**: Unexpected database error. Internal error traces and database credentials are never leaked.

---

## 6. Security & RBAC Boundaries

1. **Non-Clinical Boundary**:
   - `ADMIN` role maintains strictly administrative permissions (`staff.*`, `doctor.*`, `department.*`, `schedule.*`, `user.*`).
   - `ADMIN` **CANNOT** create consultations, author prescriptions, verify pathology reports, dispense medications, create nursing assessments, or collect billing payments.
2. **Role Elevation Protection**:
   - Staff creation rejects `role = "ADMIN"`.
   - Update endpoints ignore/reject any attempts to modify `User.role` or `Staff.role`.
3. **Identifier Immutability**:
   - System-generated IDs (`employeeId`, `doctorId`, `_id`, `userId`) are immutable after initial generation.
4. **Credential Confidentiality**:
   - Passwords are encrypted using cryptographic `scrypt` hashing with unique salt.
   - `password`, `passwordHash`, and session tokens are stripped from all API outputs.

---

## 7. Automated Test Verification

Two automated test suites verify Phase 4 and Phase 5 compliance:

### 1. Phase 4 RBAC Regression Suite (`scratch/test_phase4_rbac.js`)
- **66 assertions** covering 9 application roles, portal redirection, patient ownership isolation, and non-clinical admin boundaries.
- **Result**: `66 passed, 0 failed`.

### 2. Phase 5 Staff & Doctor Suite (`scratch/test_phase5_admin.ts`)
- **51 assertions** covering:
  - Staff listing, creation, role restriction, duplicate email rejection (409), updating, deactivation, activation.
  - Doctor listing, creation, duplicate email rejection (409), duplicate license rejection (409), updating, deactivation, activation.
  - Security boundaries: no admin creation via staff, immutable identifiers, immutable passwords, non-clinical boundary preservation.
- **Result**: `51 passed, 0 failed`.
