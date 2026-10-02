import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

function resolveSocketUrl(): string {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    // Default standalone realtime server port is 3001
    return `${protocol}//${hostname}:3001`;
  }

  return "http://localhost:3001";
}

/**
 * Returns a shared, singleton Socket.IO client instance.
 * Reuses the existing connection to prevent multiple connections per browser session.
 */
export function getSocket(): Socket {
  if (socketInstance) {
    if (!socketInstance.connected && !socketInstance.active) {
      socketInstance.connect();
    }
    return socketInstance;
  }

  const url = resolveSocketUrl();

  socketInstance = io(url, {
    withCredentials: true, // Automatically includes HttpOnly caresync_session cookie
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ["websocket", "polling"],
  });

  socketInstance.on("connect", () => {
    console.log("[CareSync Socket] Connected to realtime server with id:", socketInstance?.id);
  });

  socketInstance.on("connect_error", (error) => {
    console.warn("[CareSync Socket] Connection error:", error.message);
  });

  socketInstance.on("disconnect", (reason) => {
    console.log("[CareSync Socket] Disconnected:", reason);
  });

  return socketInstance;
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
