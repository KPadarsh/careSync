"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, AppNavSection } from "@/components/layout/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DashboardIcon,
  ReportsIcon,
  VerifiedIcon,
  PatientsIcon,
  BellIcon,
  UserIcon,
  SettingsIcon,
  MicroscopeIcon,
} from "./PathologistIcons";

interface PathologistShellProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export function PathologistShell({ children, activeRoute }: PathologistShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const { unreadCount: realtimeNotifCount } = useNotifications();
  const [badgeCounts, setBadgeCounts] = useState<{
    awaiting: number;
    underReview: number;
    notifications: number;
  }>({
    awaiting: 0,
    underReview: 0,
    notifications: 0,
  });

  useEffect(() => {
    async function fetchBadgeCounts() {
      try {
        const res = await fetch("/api/pathologist/dashboard");
        if (res.ok) {
          const data = await res.json();
          setBadgeCounts({
            awaiting: data.metrics?.awaitingReviewCount || 0,
            underReview: data.metrics?.underReviewCount || 0,
            notifications: data.metrics?.unreadNotifCount || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch pathologist badge counts:", err);
      }
    }
    fetchBadgeCounts();
  }, [pathname]);

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
          href: "/pathologist/dashboard",
          icon: <DashboardIcon className="w-4 h-4" />,
          active: pathname === "/pathologist/dashboard" || pathname === "/pathologist",
        },
        {
          label: "Pending Review",
          href: "/pathologist/reports",
          icon: <ReportsIcon className="w-4 h-4" />,
          badge: badgeCounts.awaiting > 0 ? badgeCounts.awaiting : null,
          badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
          active: pathname.startsWith("/pathologist/reports"),
        },
        {
          label: "Verified Reports",
          href: "/pathologist/verified",
          icon: <VerifiedIcon className="w-4 h-4" />,
          active: pathname.startsWith("/pathologist/verified"),
        },
      ],
    },
    {
      title: "Clinical Records",
      items: [
        {
          label: "Patient Records",
          href: "/pathologist/patients",
          icon: <PatientsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/pathologist/patients"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Notifications",
          href: "/pathologist/notifications",
          icon: <BellIcon className="w-4 h-4" />,
          badge: badgeCounts.notifications > 0 ? badgeCounts.notifications : null,
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
          active: pathname.startsWith("/pathologist/notifications"),
        },
        {
          label: "Profile",
          href: "/pathologist/profile",
          icon: <UserIcon className="w-4 h-4" />,
          active: pathname.startsWith("/pathologist/profile"),
        },
        {
          label: "Settings",
          href: "/pathologist/settings",
          icon: <SettingsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/pathologist/settings"),
        },
      ],
    },
  ];

  return (
    <AppShell
      brandName="CareSync"
      brandTagline="Pathology Diagnostics"
      brandBadge="PATHOLOGY"
      badgeColorClass="bg-teal-500/20 text-teal-300 border border-teal-500/30"
      brandIcon={
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <MicroscopeIcon className="w-4 h-4" />
        </div>
      }
      navigationSections={navigationSections}
      user={{
        name: currentUser?.name || "Pathologist",
        role: "Diagnostic Pathology",
        avatarUrl: currentUser?.avatar,
        profileHref: "/pathologist/profile",
      }}
      headerTitle="Pathology Diagnostic Center"
      headerSubtitle="Central Diagnostic Review Console"
      headerStatus={{
        label: "Verification Active",
        isOnline: true,
      }}
      notifications={{
        count: realtimeNotifCount,
        href: "/pathologist/notifications",
      }}
      onLogout={handleLogout}
      activeRoute={activeRoute}
    >
      {children}
    </AppShell>
  );
}

export * from "./PathologistIcons";
