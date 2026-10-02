# CareSync — Realtime Notification Architecture & Socket.IO Integration

## 1. Socket.IO Architecture

CareSync implements a decoupled, high-resilience realtime notification tier:

```text
Browser Portal (Client)
        ↓  (Persistent WebSocket / Polling with Session Cookie)
Dedicated Socket.IO Server (:3001)
        ↓  (Validates session token with MongoDB Session & User)
Authenticated Socket
        ↓  (Auto-joins authoritative user:<userId> and role:<ROLE> rooms)
Realtime Event Stream ("notification:new")
```

The underlying business workflow remains authoritative, persistent, and transactional in MongoDB:

```text
Browser Action (e.g. Patient Check-In)
        ↓
Next.js REST API (:3000)
        ↓
Session & RBAC Authorization (Phase 3/4)
        ↓
Domain Service Business Logic (MongoDB State Update)
        ↓
NotificationService.createNotification() / notifyRole()
        ↓
Authoritative MongoDB Write (Notification Model)
        ↓
Realtime Dispatcher (In-memory or HTTP Webhook POST :3001/api/realtime/broadcast)
        ↓
Socket.IO Server emits "notification:new" to target rooms
        ↓
Live Portals update bell badge count & notification list without page refresh
```

**Key Architectural Rules:**
- **MongoDB is the single source of truth.** Socket.IO is solely an instantaneous delivery mechanism.
- If Socket.IO or the network disconnects, notifications remain persisted in MongoDB and are automatically pulled on client reconnect.
- Realtime events are only dispatched *after* the MongoDB database write has successfully committed.

---

## 2. Authentication & Handshake Security

Socket connections must undergo strict server-side validation. **Zero client-provided identity is trusted.**

1. The client connects with `withCredentials: true`, sending the standard HTTP-only `caresync_session` cookie.
2. In `src/server/socket-server.ts`, the connection middleware extracts the cookie (or authorization token fallback).
3. The raw token is hashed via SHA-256 (`hashToken(rawToken)`).
4. The server queries MongoDB for an unexpired `Session` document matching `tokenHash`.
5. The linked `User` record is fetched and verified:
   - `status === "ACTIVE"`
   - Role is canonically normalized via `normalizeRole(user.role)` into a verified `AppRole`.
6. Identity metadata is attached to the socket server-side:
   ```ts
   socket.data.user = {
     userId,
     role,
     name,
     email,
     profileId,
     profileType
   };
   ```
7. If any check fails, the socket connection is rejected immediately with `Error("UNAUTHORIZED")`. Anonymous connections are rejected.

---

## 3. Socket Rooms Strategy

CareSync strictly partitions socket rooms by server-derived identity:

- **Personal User Room**: `user:<userId>`
  - Every authenticated socket automatically joins `user:${socket.data.user.userId}`.
  - Used for individual alerts (e.g., direct lab reports, private tasks, personal assignments).
- **Role Room**: `role:<ROLE>`
  - Every authenticated socket joins their authoritative normalized role room (e.g., `role:NURSE`, `role:DOCTOR`, `role:RECEPTIONIST`, `role:LAB_TECHNICIAN`, `role:PATHOLOGIST`, `role:PHARMACIST`, `role:BILLING_STAFF`, `role:ADMIN`, `role:PATIENT`).
  - Sockets cannot arbitrarily join rooms; client-requested room joining is rejected.

---

## 4. Notification Persistence & Database Schema

Notifications are stored in MongoDB using `src/models/Notification.ts`.

### Schema Attributes:
- `recipientUserId`: `ObjectId` referencing `User` (Authoritative recipient)
- `recipientId`: Backward-compatible alias referencing `User`
- `title`: Short descriptive header (e.g. `"New Patient Ready"`)
- `message`: Clear explanation (e.g. `"A checked-in patient is ready for nursing assessment."`)
- `type`: Category (`"queue"`, `"lab"`, `"prescription"`, `"system"`, `"alert"`)
- `isRead`: Boolean flag (default `false`)
- `link`: Optional UI target path (e.g. `"/nurse/queue"`)
- `relatedResource`:
  - `resourceType`: e.g. `"queue"`, `"appointment"`, `"lab_result"`
  - `resourceId`: string ID
- `createdAt` / `updatedAt`: Timestamps

### Compound Indexes:
- `{ recipientUserId: 1, isRead: 1, createdAt: -1 }`
- `{ recipientId: 1, isRead: 1, createdAt: -1 }`

---

## 5. NotificationService API

Implemented in [`src/services/notification.service.ts`](file:///c:/my-react-works/CareSync/src/services/notification.service.ts):

- `createNotification(input)`:
  - Validates recipient exists and is active.
  - Creates persistent MongoDB `Notification`.
  - Dispatches `notification:new` payload to `user:<userId>`.
- `notifyRole(role, input)`:
  - Finds all active users of that role in MongoDB.
  - Creates individual persistent `Notification` records for each active user (enforcing unambiguous ownership).
  - Emits `notification:new` to each recipient.
- `getNotifications(userId, options)`:
  - Strict ownership query: only returns notifications where `recipientUserId === userId`.
- `getUnreadCount(userId)`:
  - Returns numeric unread count for the authenticated user.
- `markAsRead(notificationId, userId)`:
  - Verifies `notification.recipientUserId === userId` before updating `isRead = true`. Throws `404 Not Found` if not owned by caller.
- `markAllAsRead(userId)`:
  - Scoped batch update for all unread notifications of that user.

---

## 6. Client Connection Architecture

- Implemented in [`src/lib/socket-client.ts`](file:///c:/my-react-works/CareSync/src/lib/socket-client.ts).
- Provides a singleton client connection `getSocket()`.
- Automatically connects to `http://localhost:3001` (or `process.env.NEXT_PUBLIC_SOCKET_URL`) with `withCredentials: true`.
- Transports: `["websocket", "polling"]`.
- Manages connection lifecycle (`connect`, `disconnect`, `connect_error`, `reconnect`).

---

## 7. Reconnection Strategy & Missed Events

Socket.IO handles automatic reconnection. However, events fired during a temporary disconnect might be missed over the wire.

To ensure consistency:
1. When `socket.on("reconnect")` or `"connect"` fires, [`useNotifications`](file:///c:/my-react-works/CareSync/src/hooks/useNotifications.ts) automatically executes `refreshNotifications()`.
2. `refreshNotifications()` calls `GET /api/notifications` and `GET /api/notifications/unread-count`.
3. State is reconciled with MongoDB, pulling any missed notifications and updating the unread badge.

---

## 8. Realtime Event Names & Safe Payloads

- **Event Name**: `notification:new`
- **Safe Payload Schema**:
  ```json
  {
    "id": "673f8a...",
    "type": "queue",
    "title": "New Patient Ready",
    "message": "A checked-in patient is ready for nursing assessment.",
    "link": "/nurse/queue",
    "relatedResourceType": "queue",
    "relatedResourceId": "673f89...",
    "isRead": false,
    "read": false,
    "createdAt": "2026-10-02T18:00:00.000Z"
  }
  ```
- **Zero Sensitive Data**: Passwords, hashes, tokens, internal secrets, and full medical charts are strictly excluded from socket payloads.

---

## 9. Security Model & RBAC Boundaries

1. **Authentication**: All sockets must validate against active sessions in MongoDB.
2. **Room Protection**: Sockets can only join their own `user:<userId>` room and their authorized `role:<ROLE>` room.
3. **No Client Emitters**: Clients cannot emit arbitrary notification messages. Notifications are exclusively produced server-side by trusted business workflows.
4. **Ownership Verification**: All REST endpoints (`/api/notifications/*`) resolve the logged-in session user and enforce `recipientUserId === session.user._id`.
5. **Admin Separation**: Admin users cannot read clinical notifications unless explicitly designated as recipients.

---

## 10. Reception → Nurse Workflow Implementation

### Trigger Locations:
1. **Appointment Check-in**: [`src/app/api/reception/appointments/[id]/route.ts`](file:///c:/my-react-works/CareSync/src/app/api/reception/appointments/[id]/route.ts)
   - Receptionist initiates `action === "check-in"`.
   - Appointment status updates to `"checked-in"`.
   - Queue entry is generated.
   - `NotificationService.notifyRole("NURSE", { title: "New Patient Ready", message: "A checked-in patient is ready for nursing assessment.", type: "queue", link: "/nurse/queue" })` is triggered.
2. **Walk-in Queue**: [`src/app/api/reception/walk-ins/route.ts`](file:///c:/my-react-works/CareSync/src/app/api/reception/walk-ins/route.ts)
3. **Queue Generation**: [`src/app/api/reception/queue/route.ts`](file:///c:/my-react-works/CareSync/src/app/api/reception/queue/route.ts)

### Recipient Handling:
- Active nurses in MongoDB receive their own persistent `Notification` document.
- Connected nurse browsers receive `notification:new` instantly.
- The Nurse Shell header bell updates immediately: `🔔 1`.
- Clicking the notification navigates to `/nurse/queue`.

---

## 11. Local Development Startup

To run CareSync locally with full realtime support:

```bash
# Terminal 1: Run Next.js Web App
npm run dev

# Terminal 2: Run Realtime Socket.IO Server
npm run realtime
```

Both servers run concurrently:
- Next.js Web App: `http://localhost:3000`
- Realtime Server: `http://localhost:3001`

---

## 12. Production Deployment Considerations

- **Serverless Environments (e.g. Vercel)**: Standard Next.js serverless route handlers terminate after each HTTP request and cannot maintain long-lived WebSocket connections.
- **Dedicated Realtime Process**: In production, deploy the Socket.IO server as a persistent containerized process (e.g., Docker, AWS ECS, GCP Cloud Run with WebSockets, Railway, or Heroku).
- **Horizontal Scaling**: If scaling across multiple Socket.IO server instances, configure the `@socket.io/redis-adapter` to synchronize room broadcasts across instances.

---

## 13. Future Portal-to-Portal Workflow Contract

Future clinical workflows will follow the exact same established pattern:

```text
1. Nurse → Doctor: Doctor triage alert upon vital signs completion.
2. Doctor → Lab Technician: Lab order requisition submitted.
3. Lab Technician → Pathologist: Specimen analysis completed, awaiting pathologist review.
4. Pathologist → Doctor: Verified lab report released.
5. Doctor → Pharmacist: Prescription dispensed order submitted.
6. Pharmacist → Billing: Prescription fulfillment completed, pending billing clearance.
```

Each workflow follows:
`Business Action` → `Database State Change` → `NotificationService.createNotification()` / `notifyRole()` → `MongoDB Persistence` → `Socket.IO Broadcast` → `Target Portal Live Reception`.
