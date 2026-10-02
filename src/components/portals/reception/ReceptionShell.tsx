"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, AppNavSection } from "@/components/layout/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import { Icons } from "./ReceptionIcons";

interface ReceptionShellProps {
  children: React.ReactNode;
  activeTab?: string;
  activeRoute?: string;
}

export function ReceptionShell({ children, activeRoute }: ReceptionShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const { unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);



  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/reception/patients?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/");
    }
  };

  const navigationSections: AppNavSection[] = [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
          href: "/reception/dashboard",
          icon: <Icons.Dashboard className="w-4 h-4" />,
          active: pathname === "/reception/dashboard" || pathname === "/reception",
        },
        {
          label: "Queue",
          href: "/reception/queue",
          icon: <Icons.Queue className="w-4 h-4" />,
          badge: "Live",
          badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
          active: pathname.startsWith("/reception/queue"),
        },
        {
          label: "Appointments",
          href: "/reception/appointments",
          icon: <Icons.Appointments className="w-4 h-4" />,
          active: pathname.startsWith("/reception/appointments"),
        },
        {
          label: "Patients",
          href: "/reception/patients",
          icon: <Icons.Patients className="w-4 h-4" />,
          active: pathname.startsWith("/reception/patients"),
        },
      ],
    },
    {
      title: "Front Desk Operations",
      items: [
        {
          label: "Walk-ins & Triage",
          href: "/reception/walk-ins",
          icon: <Icons.WalkIns className="w-4 h-4" />,
          active: pathname.startsWith("/reception/walk-ins"),
        },
        {
          label: "Follow-ups",
          href: "/reception/follow-ups",
          icon: <Icons.FollowUps className="w-4 h-4" />,
          active: pathname.startsWith("/reception/follow-ups"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Notifications",
          href: "/reception/notifications",
          icon: <Icons.Notifications className="w-4 h-4" />,
          badge: unreadCount > 0 ? unreadCount : null,
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
          active: pathname.startsWith("/reception/notifications"),
        },
        {
          label: "Profile",
          href: "/reception/profile",
          icon: <Icons.Profile className="w-4 h-4" />,
          active: pathname.startsWith("/reception/profile"),
        },
        {
          label: "Settings",
          href: "/reception/settings",
          icon: <Icons.Settings className="w-4 h-4" />,
          active: pathname.startsWith("/reception/settings"),
        },
      ],
    },
  ];

  return (
    <AppShell
      brandName="CareSync"
      brandTagline="Front Desk Console"
      brandBadge="RECEPTION"
      badgeColorClass="bg-teal-500/20 text-teal-300 border border-teal-500/30"
      brandIcon={
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0">
          C
        </div>
      }
      navigationSections={navigationSections}
      user={{
        name: currentUser?.name || "Front Desk Staff",
        role: "Front Desk • Station 01",
        avatarUrl: currentUser?.avatar,
        profileHref: "/reception/profile",
      }}
      headerTitle="Front Desk Desk Console"
      headerSubtitle={`Main Entrance • Desk 01 • ${currentTime}`}
      headerStatus={{
        label: "Desk Online",
        isOnline: true,
      }}
      headerActions={
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient by name / phone..."
              className="w-48 lg:w-60 pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
            />
            <Icons.Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </form>
          <button
            onClick={() => router.push("/reception/patients/new")}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Icons.Plus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>
      }
      notifications={{
        count: unreadCount,
        href: "/reception/notifications",
      }}
      onLogout={handleLogout}
      activeRoute={activeRoute}
    >
      {children}
    </AppShell>
  );
}

export * from "./ReceptionIcons";
