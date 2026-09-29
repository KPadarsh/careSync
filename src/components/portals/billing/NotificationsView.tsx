"use client";

import React, { useEffect, useState } from "react";
import {
  BillingShell,
  BellIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  DollarSignIcon,
  FileTextIcon,
  ClockIcon,
  RefreshCwIcon,
} from "./BillingShell";

interface BillingNotification {
  _id: string;
  title: string;
  message: string;
  type: "payment" | "invoice" | "overdue" | "alert" | "system";
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export function NotificationsView() {
  const [notifications, setNotifications] = useState<BillingNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/notifications");
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

  const markAllRead = async () => {
    try {
      await fetch("/api/billing/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await fetch("/api/billing/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "mark_read" }),
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

  const getIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <DollarSignIcon className="w-5 h-5 text-emerald-600" />;
      case "overdue":
        return <AlertCircleIcon className="w-5 h-5 text-rose-600" />;
      case "invoice":
        return <FileTextIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <BellIcon className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <BillingShell activeKey="notifications">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Financial Alerts & Notifications
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Operational updates regarding cashier receipts, billing drafts, and aging balances
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchNotifications()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshCwIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
            >
              <CheckCircle2Icon className="w-4 h-4" />
              Mark all as read
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === "all"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === "unread"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Unread ({notifications.filter((n) => !n.isRead).length})
          </button>
        </div>

        {/* List */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading notifications...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <BellIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No notifications</h3>
              <p className="text-sm text-slate-500 mt-1">
                {filter === "unread"
                  ? "You are caught up on all billing alerts."
                  : "No notifications recorded in your billing desk log."}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item._id}
                className={`p-4 sm:p-5 flex items-start gap-4 transition ${
                  item.isRead ? "bg-white opacity-80" : "bg-blue-50/30"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4
                      className={`text-sm font-medium ${
                        item.isRead ? "text-slate-700" : "text-slate-900 font-semibold"
                      }`}
                    >
                      {item.title}
                    </h4>
                    <span className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <ClockIcon className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.message}</p>
                </div>
                {!item.isRead && (
                  <button
                    onClick={() => markSingleRead(item._id)}
                    title="Mark as read"
                    className="p-1 text-slate-400 hover:text-blue-600 transition flex-shrink-0"
                  >
                    <CheckCircle2Icon className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </BillingShell>
  );
}
