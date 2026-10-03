"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSocket } from "@/lib/socket-client";

export interface RealtimeNotification {
  id: string;
  _id?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  relatedResourceType?: string;
  relatedResourceId?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Keep a ref of known IDs to protect against duplicate inserts across renders and reconnects
  const knownIdsRef = useRef<Set<string>>(new Set());

  // 1. Authoritative synchronization from MongoDB REST API
  const syncWithApi = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;

      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        const normalized: RealtimeNotification[] = data.notifications.map((n: any) => {
          const id = (n._id || n.id).toString();
          return {
            id,
            _id: id,
            type: n.type || "system",
            title: n.title,
            message: n.message,
            link: n.link,
            relatedResourceType: n.relatedResource?.resourceType,
            relatedResourceId: n.relatedResource?.resourceId,
            isRead: !!n.isRead,
            createdAt: n.createdAt,
          };
        });

        // Rebuild known IDs set
        const nextSet = new Set<string>();
        normalized.forEach((n) => nextSet.add(n.id));
        knownIdsRef.current = nextSet;

        setNotifications(normalized);
        setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : normalized.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      console.error("[useNotifications] API sync error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Setup Socket.IO listener and smart fallback polling
  useEffect(() => {
    // Initial fetch from MongoDB
    syncWithApi();

    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      // Synchronize immediately on reconnect in case events were missed while offline
      syncWithApi();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleNewNotification = (data: any) => {
      if (!data) return;
      const notifId = (data.id || data._id || "").toString();
      if (!notifId) return;

      // Duplicate Event Protection (Section 20)
      if (knownIdsRef.current.has(notifId)) {
        return; // Already present in local state
      }

      knownIdsRef.current.add(notifId);

      const newNotif: RealtimeNotification = {
        id: notifId,
        _id: notifId,
        type: data.type || "system",
        title: data.title || "Notification",
        message: data.message || "",
        link: data.link,
        relatedResourceType: data.relatedResourceType,
        relatedResourceId: data.relatedResourceId,
        isRead: false,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    if (socket) {
      if (socket.connected) {
        setIsConnected(true);
      }

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("notification:new", handleNewNotification);
    }

    // Smart Polling Fallback:
    // If WebSockets are unavailable or disconnected (e.g. cloud serverless deployments like Vercel),
    // automatically poll every 5 seconds to ensure live cross-portal delivery without user refresh.
    // If connected via WebSockets, poll every 30 seconds as background freshness synchronization.
    const pollIntervalMs = isConnected ? 30000 : 5000;
    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncWithApi();
      }
    }, pollIntervalMs);

    // Immediate sync when returning to active browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncWithApi();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (socket) {
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleDisconnect);
        socket.off("notification:new", handleNewNotification);
      }
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncWithApi, isConnected]);

  // 3. Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("[useNotifications] Failed to mark as read:", err);
      // Re-sync on failure
      syncWithApi();
    }
  }, [syncWithApi]);

  // 4. Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
    } catch (err) {
      console.error("[useNotifications] Failed to mark all as read:", err);
      syncWithApi();
    }
  }, [syncWithApi]);

  return {
    notifications,
    unreadCount,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
    refresh: syncWithApi,
  };
}
