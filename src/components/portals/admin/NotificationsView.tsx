"use client";

import React, { useState, useEffect } from "react";
import {
  AdminShell,
  BellIcon,
  CheckCircleIcon,
  RefreshIcon,
  ClockIcon,
  ShieldIcon,
  AlertTriangleIcon,
} from "./AdminShell";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Error marking read:", err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  return (
    <AdminShell activeKey="notifications">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              System Administration Alerts
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Infrastructure notices, compliance checks, duty schedule publications, and security warnings.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Mark All Read
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filter === "unread"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Unread ({notifications.filter((n) => !n.isRead).length})
          </button>
        </div>

        {/* Notifications List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading alerts...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <BellIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No alerts found</h3>
              <p className="text-sm text-slate-500 mt-1">
                {filter === "unread"
                  ? "All administrative notifications have been read."
                  : "No alerts logged in the system."}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item._id}
                className={`p-4 sm:p-5 flex items-start gap-4 transition ${
                  item.isRead ? "bg-white opacity-80" : "bg-indigo-50/20"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-indigo-600">
                  <ShieldIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-sm ${
                        item.isRead ? "text-slate-700 font-medium" : "text-slate-900 font-bold"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <ClockIcon className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{item.message}</p>
                </div>
                {!item.isRead && (
                  <button
                    onClick={() => handleMarkSingleRead(item._id)}
                    title="Mark as read"
                    className="p-1 text-slate-400 hover:text-indigo-600 transition flex-shrink-0"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminShell>
  );
}
