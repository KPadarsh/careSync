"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, AppNavSection } from "@/components/layout/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  DashboardIcon,
  StaffIcon,
  DoctorsIcon,
  DepartmentsIcon,
  SchedulesIcon,
  UsersIcon,
  ReportsIcon,
  AuditLogsIcon,
  BellIcon,
  UserIcon,
  SettingsIcon,
  ShieldIcon,
} from "./AdminIcons";

interface AdminShellProps {
  children: React.ReactNode;
  activeRoute?: string;
  activeKey?: string;
}

export function AdminShell({ children, activeRoute }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [badgeCounts, setBadgeCounts] = useState<{
    pendingTasks: number;
    notifications: number;
  }>({
    pendingTasks: 0,
    notifications: 0,
  });

  useEffect(() => {
    async function fetchBadgeCounts() {
      try {
        const [dashRes, notifRes] = await Promise.all([
          fetch("/api/admin/dashboard"),
          fetch("/api/admin/notifications"),
        ]);
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          if (dashData.success) {
            setBadgeCounts((prev) => ({
              ...prev,
              pendingTasks: dashData.stats?.pendingAdminTasks || 0,
            }));
          }
        }
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (notifData.success) {
            setBadgeCounts((prev) => ({
              ...prev,
              notifications: notifData.unreadCount || 0,
            }));
          }
        }
      } catch {
        // Fallback to default
      }
    }
    fetchBadgeCounts();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore
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
          href: "/admin/dashboard",
          icon: <DashboardIcon className="w-4 h-4" />,
          active: pathname === "/admin/dashboard" || pathname === "/admin",
        },
        {
          label: "Staff Directory",
          href: "/admin/staff",
          icon: <StaffIcon className="w-4 h-4" />,
          active: pathname.startsWith("/admin/staff"),
        },
        {
          label: "Doctors & Rosters",
          href: "/admin/doctors",
          icon: <DoctorsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/admin/doctors"),
        },
      ],
    },
    {
      title: "Infrastructure & Ops",
      items: [
        {
          label: "Departments",
          href: "/admin/departments",
          icon: <DepartmentsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/admin/departments"),
        },
        {
          label: "Schedules",
          href: "/admin/schedules",
          icon: <SchedulesIcon className="w-4 h-4" />,
          active: pathname.startsWith("/admin/schedules"),
        },
        {
          label: "Users & Roles",
          href: "/admin/users",
          icon: <UsersIcon className="w-4 h-4" />,
          active: pathname.startsWith("/admin/users"),
        },
        {
          label: "Reports & Analytics",
          href: "/admin/reports",
          icon: <ReportsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/admin/reports"),
        },
        {
          label: "Audit Logs",
          href: "/admin/audit-logs",
          icon: <AuditLogsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/admin/audit-logs"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Notifications",
          href: "/admin/notifications",
          icon: <BellIcon className="w-4 h-4" />,
          badge: badgeCounts.notifications > 0 ? badgeCounts.notifications : null,
          badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
          active: pathname.startsWith("/admin/notifications"),
        },
        {
          label: "Profile",
          href: "/admin/profile",
          icon: <UserIcon className="w-4 h-4" />,
          active: pathname.startsWith("/admin/profile"),
        },
        {
          label: "Settings",
          href: "/admin/settings",
          icon: <SettingsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/admin/settings"),
        },
      ],
    },
  ];

  return (
    <AppShell
      brandName="CareSync"
      brandTagline="System Administration"
      brandBadge="ADMIN"
      badgeColorClass="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
      brandIcon={
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <ShieldIcon className="w-4 h-4" />
        </div>
      }
      navigationSections={navigationSections}
      user={{
        name: currentUser?.name || "Administrator",
        role: "Hospital Operations",
        initials: currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "AD",
        avatarUrl: currentUser?.avatar,
        profileHref: "/admin/profile",
      }}
      headerTitle="Administration Console"
      headerSubtitle="System Operations & Security"
      headerStatus={{
        label: "Systems Operational",
        isOnline: true,
      }}
      headerActions={
        <Link
          href="/admin/audit-logs"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-lg transition-colors"
        >
          <ShieldIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span>Audit Console</span>
        </Link>
      }
      notifications={{
        count: badgeCounts.notifications,
        href: "/admin/notifications",
      }}
      onLogout={handleLogout}
      activeRoute={activeRoute}
    >
      {children}
    </AppShell>
  );
}

export * from "./AdminIcons";
