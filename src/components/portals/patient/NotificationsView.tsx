"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
  const [filter, setFilter] = useState<string>("all");

  const loadNotifications = () => {
    fetch("/api/patient/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.notifications) {
          setNotifications(data.notifications);
        }
      })
      .catch((err) => console.error("Error loading notifications:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch("/api/patient/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/patient/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return (
          <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#3b82f6] flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case "lab_report":
        return (
          <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#006a61] flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case "prescription":
        return (
          <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#22c55e] flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
        );
      case "follow_up":
        return (
          <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#f59e0b] flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-[#eff4ff] text-[#131b2e] flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Notifications</h2>
          <p className="text-sm text-[#45464d] mt-1">
            Real-time alerts, appointment updates, test results, and prescription changes.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-[#006a61] hover:underline cursor-pointer self-start sm:self-auto px-3 py-1.5 rounded-lg border border-[#006a61]/20 hover:bg-[#006a61]/5 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#e2e8f0] pb-3">
        {[
          { id: "all", label: "All Alerts" },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "appointment", label: "Appointments" },
          { id: "lab_report", label: "Lab Reports" },
          { id: "prescription", label: "Prescriptions" },
          { id: "follow_up", label: "Follow-ups" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              filter === tab.id
                ? "bg-[#131b2e] text-white"
                : "bg-[#eff4ff] text-[#45464d] hover:text-[#0b1c30]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-[#e2e8f0] animate-pulse flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#006a61] mx-auto flex items-center justify-center mb-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[#0b1c30]">No notifications</h3>
          <p className="text-xs text-[#45464d] max-w-sm mx-auto mt-1">
            You do not have any notifications matching this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && handleMarkAsRead(n._id)}
              className={`bg-white rounded-xl border transition-all p-4 flex items-start gap-4 ${
                !n.isRead
                  ? "border-[#131b2e]/30 bg-[#eff4ff]/20 shadow-sm"
                  : "border-[#e2e8f0] opacity-90"
              }`}
            >
              {getIcon(n.type)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-[#0b1c30] truncate">{n.title}</h4>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-[#45464d]">
                      {new Date(n.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#3b82f6]" title="Unread" />
                    )}
                  </div>
                </div>

                <p className="text-xs text-[#45464d] mt-1 leading-relaxed">{n.message}</p>

                {n.link && (
                  <div className="mt-2.5">
                    <Link
                      href={n.link}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006a61] hover:underline"
                    >
                      View Details
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
