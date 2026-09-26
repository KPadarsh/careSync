"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconNotifications,
  IconAlertTriangle,
  IconCheckCircle,
  IconClock,
  IconCheck,
  IconRefresh,
  IconFlask,
  IconChevronRight,
} from "./LabIcons";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "urgent" | "alert" | "info" | "success";
  read: boolean;
  timestamp: string;
  link?: string;
}

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lab/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/lab/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-read", id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/lab/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <IconAlertTriangle className="w-5 h-5 text-rose-600" />;
      case "alert":
        return <IconAlertTriangle className="w-5 h-5 text-amber-500" />;
      case "success":
        return <IconCheckCircle className="w-5 h-5 text-emerald-600" />;
      default:
        return <IconFlask className="w-5 h-5 text-[#004ac6]" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laboratory Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time STAT request alerts, pathologist verification updates, and analyzer status logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#004ac6] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <IconCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
          <button
            onClick={loadNotifications}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <IconRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-[#004ac6] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <IconNotifications className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No notifications at this time</p>
            <p className="text-xs text-slate-400">All alerts and updates have been resolved.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                !notif.read ? "bg-blue-50/30" : "hover:bg-slate-50/50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === "urgent"
                      ? "bg-rose-50"
                      : notif.type === "alert"
                      ? "bg-amber-50"
                      : notif.type === "success"
                      ? "bg-emerald-50"
                      : "bg-blue-50"
                  }`}
                >
                  {getTypeIcon(notif.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{notif.title}</h3>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#004ac6] inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{notif.message}</p>
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <IconClock className="w-3 h-3" />
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                    {notif.link && (
                      <Link
                        href={notif.link}
                        className="text-[11px] font-semibold text-[#004ac6] hover:underline flex items-center gap-1"
                      >
                        View Details
                        <IconChevronRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {!notif.read && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  title="Mark as read"
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg text-xs"
                >
                  <IconCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
