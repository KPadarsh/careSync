"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BellIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PrescriptionsIcon,
  MedicinesIcon,
  RefreshIcon,
} from "./PharmacyIcons";

export function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pharmacy/notifications");
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/pharmacy/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      await fetchNotifications();
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch("/api/pharmacy/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      await fetchNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-teal-400">
              DISPENSARY COMMUNICATIONS
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Pharmacy Notifications & Alerts
          </h1>
          <p className="text-sm text-slate-400">
            Real-time doctor prescription arrivals, stock shortages, and physician responses.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="bg-[#0A1324] border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-800/60">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">
            <div className="w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-400">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-400">
            No notifications at this time. You're all caught up!
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-5 flex items-start gap-4 transition-colors ${
                !n.isRead ? "bg-slate-900/80" : "hover:bg-slate-900/40"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  n.title.toLowerCase().includes("stock") || n.title.toLowerCase().includes("shortage")
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                }`}
              >
                {n.title.toLowerCase().includes("stock") ? (
                  <AlertTriangleIcon className="w-5 h-5" />
                ) : (
                  <PrescriptionsIcon className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white truncate">{n.title}</h4>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{n.message}</p>

                <div className="mt-2.5 flex items-center gap-3">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="text-xs font-semibold text-teal-400 hover:underline"
                    >
                      View in Portal →
                    </Link>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n._id)}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>

              {!n.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
