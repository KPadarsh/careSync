"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Icons } from "./ReceptionIcons";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: "appointment" | "prescription" | "lab_report" | "follow_up" | "system";
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reception/notifications?type=${typeFilter}`);
      if (!res.ok) throw new Error("Failed to load alerts");
      const json = await res.json();
      setNotifications(json.notifications || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error fetching alerts");
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/reception/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch {
      // silently ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/reception/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch {
      // ignore
    }
  };

  const handleClearRead = async () => {
    try {
      const res = await fetch("/api/reception/notifications", {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => !n.isRead));
      }
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
              Alerts &amp; Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational broadcast alerts, schedule delays, and triage notices
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={handleClearRead}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            Clear read
          </button>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: "all", label: "All Alerts" },
          { id: "system", label: "System & Delays" },
          { id: "appointment", label: "Patient Arrivals" },
          { id: "follow_up", label: "Recall Orders" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTypeFilter(item.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              typeFilter === item.id
                ? "bg-[#00355f] text-white shadow-2xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* FEED */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Checking alerts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600 text-xs">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Icons.Notifications className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No notifications</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your front desk notification feed is completely clear.
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isSystem = item.type === "system";
            const isAppointment = item.type === "appointment";

            return (
              <div
                key={item._id}
                onClick={() => !item.isRead && handleMarkAsRead(item._id)}
                className={`p-4 transition-colors flex items-start justify-between gap-4 cursor-pointer ${
                  !item.isRead ? "bg-teal-50/20 hover:bg-teal-50/40" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSystem
                        ? "bg-amber-100 text-amber-800"
                        : isAppointment
                        ? "bg-teal-100 text-teal-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {isSystem ? (
                      <Icons.AlertTriangle className="w-5 h-5" />
                    ) : isAppointment ? (
                      <Icons.UserCheck className="w-5 h-5" />
                    ) : (
                      <Icons.FollowUps className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900">{item.title}</p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{item.message}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      {item.link && (
                        <Link
                          href={item.link}
                          className="font-semibold text-teal-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Related Screen →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!item.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(item._id);
                    }}
                    className="text-[11px] font-semibold text-teal-800 hover:text-teal-950 p-1 shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
