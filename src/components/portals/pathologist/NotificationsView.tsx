"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BellIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
} from "./PathologistIcons";

export function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/pathologist/notifications");
      if (res.ok) {
        const json = await res.json();
        setNotifications(json.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/pathologist/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      fetchNotifs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10 space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002444] tracking-tight">
            Workstation Priority Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            STAT order alerts, specimen recollection notices, analyzer panic values, and clinical communications.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#00355f] text-xs font-semibold shadow-sm self-start sm:self-auto"
        >
          Mark All as Read
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <CheckCircleIcon className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No active alerts</p>
            <p className="text-xs text-slate-400">All workstation notifications are up to date.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex items-start gap-4 transition-colors ${
                !n.isRead ? "bg-amber-50/20" : "hover:bg-slate-50/80"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  n.priority === "high"
                    ? "bg-rose-100 text-rose-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {n.priority === "high" ? (
                  <AlertTriangleIcon className="w-5 h-5" />
                ) : (
                  <BellIcon className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <div className="mt-2 flex items-center gap-3">
                  <Link
                    href={n.link}
                    className="text-xs font-semibold text-[#006a68] hover:underline"
                  >
                    View in Workbench →
                  </Link>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
