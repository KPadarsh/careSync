import { createServer, IncomingMessage, ServerResponse } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { connectToDatabase } from "@/lib/db";
import { Session } from "@/models/Session";
import { User } from "@/models/User";
import { normalizeRole, AppRole } from "@/lib/permissions";
import { hashToken, parseTokenFromCookie } from "@/services/auth.service";

const SESSION_COOKIE_NAME = "caresync_session";
const INTERNAL_REALTIME_SECRET =
  process.env.INTERNAL_REALTIME_SECRET || "caresync_realtime_internal_secret_2026";

export interface AuthenticatedSocketUser {
  userId: string;
  role: AppRole;
  name: string;
  email: string;
  profileId?: string;
  profileType?: string;
}

export interface CareSyncSocket extends Socket {
  data: {
    user?: AuthenticatedSocketUser;
  };
}

let ioInstance: SocketIOServer | null = null;

/**
 * Returns the active Socket.IO server instance if initialized.
 */
export function getIO(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Resolves session and authenticated user from raw cookie string or bearer token.
 */
export async function authenticateSocketHandshake(
  cookieHeader?: string,
  authToken?: string
): Promise<AuthenticatedSocketUser | null> {
  try {
    await connectToDatabase();

    let rawToken: string | null = null;

    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]*)`));
      if (match?.[1]) {
        rawToken = parseTokenFromCookie(decodeURIComponent(match[1]));
      }
    }

    if (!rawToken && authToken) {
      rawToken = parseTokenFromCookie(authToken);
    }

    if (!rawToken || rawToken.trim().length < 16) {
      return null;
    }

    const tokenHash = hashToken(rawToken);

    // Verify session existence and expiration in MongoDB
    const session = await Session.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!session) {
      return null;
    }

    // Resolve authoritative User from database
    const user = await User.findById(session.userId).lean();
    if (!user) {
      return null;
    }

    const statusNorm = (user.status || "").toUpperCase();
    if (statusNorm !== "ACTIVE") {
      return null;
    }

    const canonicalRole = normalizeRole(user.role);
    if (!canonicalRole) {
      return null;
    }

    return {
      userId: (user._id as any).toString(),
      role: canonicalRole,
      name: user.name,
      email: user.email,
      profileId: user.profileId?.toString(),
      profileType: user.profileType,
    };
  } catch (err) {
    console.error("[SocketServer] Handshake authentication error:", err);
    return null;
  }
}

/**
 * Initializes Socket.IO on an HTTP server with strict authentication, room authorization,
 * and security boundaries.
 */
export function initSocketServer(httpServer: any): SocketIOServer {
  if (ioInstance) {
    return ioInstance;
  }

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow same-origin or localhost during development
        if (
          !origin ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:") ||
          origin === process.env.NEXT_PUBLIC_APP_URL
        ) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in dev, restricted by session cookie
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Strict Socket.IO Authentication Middleware
  io.use(async (socket: CareSyncSocket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const authToken = socket.handshake.auth?.token;

      const user = await authenticateSocketHandshake(cookieHeader, authToken);
      if (!user) {
        return next(new Error("UNAUTHORIZED"));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      console.error("[SocketServer] Middleware auth rejection:", err);
      next(new Error("AUTHENTICATION_FAILED"));
    }
  });

  io.on("connection", (socket: CareSyncSocket) => {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    // Automatically join authoritative personal room and authorized role room
    const userRoom = `user:${user.userId}`;
    const roleRoom = `role:${user.role}`;

    socket.join(userRoom);
    socket.join(roleRoom);

    // Prevent clients from arbitrary room joining
    socket.onAny((eventName) => {
      if (eventName.startsWith("join:") || eventName === "join-room") {
        console.warn(`[SocketServer] Rejected unauthorized room join attempt from user ${user.userId}`);
      }
    });

    socket.on("disconnect", () => {
      // Clean socket cleanup handled automatically by Socket.IO
    });
  });

  ioInstance = io;
  (globalThis as any).__caresync_io_instance = io;
  (globalThis as any).__caresync_broadcast = broadcastRealtimeNotification;
  return io;
}

/**
 * Safely broadcasts a realtime notification event to target user room or role room.
 */
export function broadcastRealtimeNotification(target: {
  userId?: string;
  role?: string;
}, payload: Record<string, unknown>): boolean {
  if (!ioInstance) {
    return false;
  }

  if (target.userId) {
    ioInstance.to(`user:${target.userId}`).emit("notification:new", payload);
  } else if (target.role) {
    const normRole = normalizeRole(target.role);
    if (normRole) {
      ioInstance.to(`role:${normRole}`).emit("notification:new", payload);
    }
  }

  return true;
}

/**
 * Starts a standalone dedicated Socket.IO HTTP server on the configured port.
 */
export function startStandaloneSocketServer(port = 3001) {
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    // Health check endpoint
    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", service: "CareSync-Realtime-Server" }));
      return;
    }

    // Internal emit endpoint for inter-process communication
    if (req.method === "POST" && req.url === "/api/realtime/broadcast") {
      const secret = req.headers["x-realtime-secret"];
      if (secret !== INTERNAL_REALTIME_SECRET) {
        res.writeHead(403, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Forbidden: Invalid realtime secret" }));
        return;
      }

      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          const { target, payload } = parsed;

          if (!target || !payload) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid payload: target and payload required" }));
            return;
          }

          const success = broadcastRealtimeNotification(target, payload);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success }));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  });

  initSocketServer(server);

  server.listen(port, () => {
    console.log(`[CareSync Realtime] Socket.IO server running on port ${port}`);
  });

  return server;
}

// Auto-run if executed directly via CLI
if (require.main === module) {
  const port = parseInt(process.env.SOCKET_PORT || process.env.REALTIME_PORT || "3001", 10);
  startStandaloneSocketServer(port);
}
