"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IconBell,
  IconCheckCircle,
  IconAlertTriangle,
  IconFlask,
  IconUsers,
  IconCalendar,
  IconClock,
  IconChevronRight,
  IconRefresh,
  IconCheck,
} from "./DoctorIcons";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "lab" | "queue" | "followup">("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/doctor/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch("/api/doctor/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/doctor/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "all") return true;
    if (filter === "lab") {
      return (
        item.type?.toLowerCase().includes("lab") ||
        item.title?.toLowerCase().includes("lab") ||
        item.message?.toLowerCase().includes("lab") ||
        item.message?.toLowerCase().includes("pathology")
      );
    }
    if (filter === "queue") {
      return (
        item.type?.toLowerCase().includes("queue") ||
        item.type?.toLowerCase().includes("triage") ||
        item.title?.toLowerCase().includes("queue") ||
        item.title?.toLowerCase().includes("patient") ||
        item.message?.toLowerCase().includes("ready")
      );
    }
    if (filter === "followup") {
      return (
        item.type?.toLowerCase().includes("follow") ||
        item.title?.toLowerCase().includes("follow") ||
        item.message?.toLowerCase().includes("follow")
      );
    }
    return true;
  });

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getNotificationIcon = (n: NotificationItem) => {
    const title = n.title?.toLowerCase() || "";
    const type = n.type?.toLowerCase() || "";
    if (title.includes("lab") || type.includes("lab")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shadow-sm">
          <IconFlask className="w-5 h-5" />
        </div>
      );
    }
    if (title.includes("follow") || type.includes("follow")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shadow-sm">
          <IconCalendar className="w-5 h-5 text-primary" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
        <IconUsers className="w-5 h-5" />
      </div>
    );
  };

  const getActionLabel = (n: NotificationItem) => {
    const title = n.title?.toLowerCase() || "";
    const type = n.type?.toLowerCase() || "";
    if (title.includes("lab") || type.includes("lab")) return "View Lab Report";
    if (title.includes("follow") || type.includes("follow")) return "View Follow-up";
    return "Open Queue";
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
              <IconBell className="w-4 h-4 text-primary" />
            </span>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-secondary">
            Stay updated on verified lab results, nurse triage handoffs, and scheduled follow-ups.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-variant text-xs font-semibold text-primary transition-colors self-start sm:self-auto"
          >
            <IconCheck className="w-4 h-4" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-outline-variant/30 pb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === "all"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-secondary hover:text-on-surface border border-outline-variant/30"
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("lab")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === "lab"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-secondary hover:text-on-surface border border-outline-variant/30"
          }`}
        >
          Lab Reports
        </button>
        <button
          onClick={() => setFilter("queue")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === "queue"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-secondary hover:text-on-surface border border-outline-variant/30"
          }`}
        >
          Queue &amp; Triage
        </button>
        <button
          onClick={() => setFilter("followup")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === "followup"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-secondary hover:text-on-surface border border-outline-variant/30"
          }`}
        >
          Follow-ups
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-sm text-secondary bg-white rounded-xl border border-outline-variant/30">
            <IconRefresh className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center text-sm text-secondary bg-white rounded-xl border border-outline-variant/30">
            <IconCheckCircle className="w-8 h-8 mx-auto text-tertiary mb-2" />
            <p className="font-semibold text-on-surface">You&apos;re all caught up!</p>
            <p className="text-xs text-secondary mt-1">No pending notifications in this category</p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <article
              key={item._id}
              onClick={() => {
                if (!item.isRead) markAsRead(item._id);
              }}
              className={`relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl transition-all shadow-sm gap-4 border cursor-pointer ${
                item.isRead
                  ? "bg-white border-outline-variant/30 hover:bg-surface-container-low/40"
                  : "bg-primary-fixed/10 border-primary/30 hover:bg-primary-fixed/20"
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="relative shrink-0 mt-0.5">
                  {getNotificationIcon(item)}
                  {!item.isRead && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary ring-2 ring-white"></span>
                  )}
                </div>

                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-on-surface">{item.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[11px] font-semibold capitalize">
                      {item.type || "Update"}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{item.message}</p>
                  <div className="flex items-center gap-3 pt-0.5 text-secondary text-[11px]">
                    <span className="flex items-center gap-1">
                      <IconClock className="w-3.5 h-3.5" />
                      {getTimeAgo(item.createdAt)}
                    </span>
                    <span>•</span>
                    <span>Doctor Portal</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 md:self-center pl-13 md:pl-0">
                <Link
                  href={item.link || "/doctor/dashboard"}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-surface-container hover:bg-primary hover:text-white transition-colors text-xs font-semibold text-primary shadow-sm"
                >
                  <span>{getActionLabel(item)}</span>
                  <IconChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
