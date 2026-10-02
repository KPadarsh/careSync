"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  IconBell,
  IconCheckCircle,
  IconFlask,
  IconUsers,
  IconCalendar,
  IconClock,
  IconChevronRight,
  IconRefresh,
  IconCheck,
} from "./DoctorIcons";

import { useNotifications, RealtimeNotification } from "@/hooks/useNotifications";

export function NotificationsView() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const [filter, setFilter] = useState<"all" | "lab" | "queue" | "followup">("all");

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

  const getNotificationIcon = (n: RealtimeNotification) => {
    const title = n.title?.toLowerCase() || "";
    const type = n.type?.toLowerCase() || "";
    if (title.includes("lab") || type.includes("lab") || title.includes("pathology")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center justify-center shrink-0">
          <IconFlask className="w-5 h-5" />
        </div>
      );
    }
    if (title.includes("follow") || type.includes("follow")) {
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
          <IconCalendar className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/80 flex items-center justify-center shrink-0">
        <IconUsers className="w-5 h-5" />
      </div>
    );
  };

  const getActionLabel = (n: RealtimeNotification) => {
    const title = n.title?.toLowerCase() || "";
    const type = n.type?.toLowerCase() || "";
    if (title.includes("lab") || type.includes("lab")) return "View Lab Report";
    if (title.includes("follow") || type.includes("follow")) return "View Follow-up";
    return "Open Queue";
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <PageHeader
        title="Notifications"
        description="Stay updated on verified lab results, nurse triage handoffs, and scheduled follow-ups."
        badge={
          unreadCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              {unreadCount} Unread
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              All Caught Up
            </span>
          )
        }
        actions={
          unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
            >
              <IconCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Mark all as read</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: `All (${notifications.length})` },
          { id: "lab", label: "Lab Reports" },
          { id: "queue", label: "Queue & Triage" },
          { id: "followup", label: "Follow-ups" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200/80">
            <IconRefresh className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200/80">
            <IconCheckCircle className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
            <p className="font-semibold text-slate-900">You&apos;re all caught up!</p>
            <p className="text-xs text-slate-400 mt-1">No pending notifications in this category</p>
          </div>
        ) : (
          filteredNotifications.map((item) => {
            const notifId = item.id || item._id;
            return (
              <article
                key={notifId}
                onClick={() => {
                  if (!item.isRead) markAsRead((notifId || "") as string);
                }}
                className={`relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl transition-all shadow-xs gap-4 border cursor-pointer ${
                  item.isRead
                    ? "bg-white border-slate-200/80 hover:bg-slate-50/60"
                    : "bg-sky-50/60 border-sky-200/80 hover:bg-sky-50"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="relative shrink-0 mt-0.5">
                    {getNotificationIcon(item)}
                    {!item.isRead && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-white" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{item.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 text-[10px] font-semibold uppercase tracking-wider">
                        {item.type || "Update"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-3 pt-0.5 text-slate-400 text-[11px]">
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
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 transition-colors text-xs font-semibold text-slate-700 shadow-xs"
                  >
                    <span>{getActionLabel(item)}</span>
                    <IconChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
