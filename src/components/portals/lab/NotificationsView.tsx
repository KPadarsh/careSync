"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  NotificationsIcon,
  RefreshIcon,
  CheckIcon,
  AlertTriangleIcon,
  ClockIcon,
  RequestsIcon,
} from "./LabIcons";

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/lab/notifications");
      if (!res.ok) {
        throw new Error("Failed to load notifications");
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch("/api/lab/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Mark notification as read error:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch("/api/lab/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Mark all notifications read error:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">
              Laboratory Notifications &amp; Alerts
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
              {notifications.filter((n) => !n.isRead).length} Unread
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            STAT order alerts, specimen recollection notices, analyzer telemetry, and pathologist feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all"
          >
            <CheckIcon size={14} />
            <span>Mark All as Read</span>
          </button>

          <button
            type="button"
            onClick={fetchNotifications}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00355f] text-white hover:bg-[#0f4c81] text-xs font-semibold shadow-xs transition-all"
          >
            <RefreshIcon
              size={14}
              className={refreshing ? "animate-spin text-teal-300" : "text-white"}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-sm">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 px-4">
            <NotificationsIcon size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No pending laboratory alerts.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  !n.isRead ? "bg-blue-50/40" : "hover:bg-slate-50/60"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.type === "lab_report"
                        ? "bg-rose-100 text-rose-700"
                        : n.type === "system"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    <NotificationsIcon size={18} />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {n.link && (
                        <Link
                          href={n.link}
                          className="font-semibold text-[#006a68] hover:underline"
                        >
                          View Related Request →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(n._id)}
                    className="text-xs text-slate-400 hover:text-slate-700 font-semibold px-2 py-1 rounded hover:bg-white"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
