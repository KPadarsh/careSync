"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  NotificationsIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  RefreshIcon,
} from "./NurseIcons";

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/nurse/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/nurse/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        fetchNotifs();
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch("/api/nurse/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        fetchNotifs();
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">Nurse Notifications</h1>
          <p className="text-sm text-slate-500 mt-1">
            Clinical triage warnings, vital alerts, and department communications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs"
          >
            Mark All as Read
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            You have no notifications at this time.
          </div>
        ) : (
          notifications.map((n) => {
            const isRead = n.isRead;
            const isAlert = n.title.toLowerCase().includes("alert") || n.title.toLowerCase().includes("elevated");

            return (
              <div
                key={n._id}
                className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                  !isRead ? "bg-blue-50/30" : "hover:bg-slate-50/70"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isAlert
                        ? "bg-rose-100 text-rose-700"
                        : "bg-teal-50 text-[#006a61]"
                    }`}
                  >
                    {isAlert ? <AlertTriangleIcon size={18} /> : <NotificationsIcon size={18} />}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 leading-tight">
                        {n.title}
                      </span>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-2">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
                    >
                      View
                    </Link>
                  )}
                  {!isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n._id)}
                      className="p-1 text-slate-400 hover:text-slate-600 text-xs"
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
