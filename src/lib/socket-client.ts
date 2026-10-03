import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;
let hasLoggedFailure = false;

export function resolveSocketUrl(): string | null {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    // Only default to port 3001 if we are explicitly running locally on localhost / 127.0.0.1
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:3001`;
    }
    // When deployed to production (e.g. Vercel) without a dedicated external NEXT_PUBLIC_SOCKET_URL,
    // do NOT attempt connecting to :3001 as cloud platforms do not expose arbitrary ports.
    return null;
  }

  return null;
}

/**
 * Returns a shared, singleton Socket.IO client instance, or null if no realtime server is configured.
 * Reuses the existing connection to prevent multiple connections per browser session.
 */
export function getSocket(): Socket | null {
  if (socketInstance) {
    if (!socketInstance.connected && !socketInstance.active) {
      socketInstance.connect();
    }
    return socketInstance;
  }

  const url = resolveSocketUrl();
  if (!url) {
    return null;
  }

  try {
    socketInstance = io(url, {
      withCredentials: true, // Automatically includes HttpOnly caresync_session cookie
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 5000,
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      hasLoggedFailure = false;
      console.log("[CareSync Socket] Connected to realtime server with id:", socketInstance?.id);
    });

    socketInstance.on("connect_error", (error) => {
      if (!hasLoggedFailure) {
        console.warn("[CareSync Socket] Realtime server unavailable, using live polling fallback:", error.message);
        hasLoggedFailure = true;
      }
    });

    socketInstance.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socketInstance?.connect();
      }
    });

    return socketInstance;
  } catch (err) {
    console.warn("[CareSync Socket] Failed to initialize socket connection:", err);
    return null;
  }
}

/**
 * Cleanly disconnects the singleton Socket.IO client instance.
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
}

