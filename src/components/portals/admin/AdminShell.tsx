"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogoutIcon,
  ShieldIcon,
} from "./AdminIcons";

interface AdminShellProps {
  children: React.ReactNode;
  activeRoute?: string;
  activeKey?: string;
}

export function AdminShell({ children, activeRoute, activeKey }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<{
    pendingTasks: number;
    notifications: number;
  }>({
    pendingTasks: 3,
    notifications: 2,
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
      } catch (err) {
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

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <DashboardIcon className="w-5 h-5" />,
      badge: null,
    },
    {
      key: "staff",
      label: "Staff",
      href: "/admin/staff",
      icon: <StaffIcon className="w-5 h-5" />,
      badge: null,
    },
    {
      key: "doctors",
      label: "Doctors",
      href: "/admin/doctors",
      icon: <DoctorsIcon className="w-5 h-5" />,
      badge: null,
    },
    {
      key: "departments",
      label: "Departments",
      href: "/admin/departments",
      icon: <DepartmentsIcon className="w-5 h-5" />,
      badge: null,
    },
    {
      key: "schedules",
      label: "Schedules",
      href: "/admin/schedules",
      icon: <SchedulesIcon className="w-5 h-5" />,
      badge: null,
    },
    {
      key: "users",
      label: "Users & Roles",
      href: "/admin/users",
      icon: <UsersIcon className="w-5 h-5" />,
      badge: null,
    },
    {
      key: "reports",
      label: "Reports",
      href: "/admin/reports",
      icon: <ReportsIcon className="w-5 h-5" />,
      badge: null,
    },
    {
      key: "audit-logs",
      label: "Audit Logs",
      href: "/admin/audit-logs",
      icon: <AuditLogsIcon className="w-5 h-5" />,
      badge: null,
    },
    {
      key: "notifications",
      label: "Notifications",
      href: "/admin/notifications",
      icon: <BellIcon className="w-5 h-5" />,
      badge: badgeCounts.notifications > 0 ? badgeCounts.notifications : null,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      key: "profile",
      label: "Profile",
      href: "/admin/profile",
      icon: <UserIcon className="w-5 h-5" />,
      badge: null,
    },
    {
      key: "settings",
      label: "Settings",
      href: "/admin/settings",
      icon: <SettingsIcon className="w-5 h-5" />,
      badge: null,
    },
  ];

  const isActive = (href: string, key?: string) => {
    if (activeKey && key) return activeKey === key;
    if (activeRoute) return activeRoute === href;
    if (href === "/admin/dashboard") return pathname === "/admin/dashboard" || pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300">
        {/* Logo / Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <ShieldIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              CareSync
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ADMIN
              </span>
            </div>
            <div className="text-[11px] text-slate-400">System Administration</div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Infrastructure & Ops
          </div>
          {navItems.map((item) => {
            const active = isActive(item.href, item.key);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition font-medium ${
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={active ? "text-white" : "text-slate-400"}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      item.badgeColor || "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Administrator Profile Card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 mb-2">
            <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-indigo-300">
              AW
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">Alexander Wright</div>
              <div className="text-[11px] text-slate-400 truncate">System Administrator</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogoutIcon className="w-4 h-4" />
            <span>Sign Out Console</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                System Infrastructure Healthy
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/audit-logs"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <ShieldIcon className="w-3.5 h-3.5 text-indigo-600" />
              Audit Console
            </Link>

            <Link
              href="/admin/notifications"
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Notifications"
            >
              <BellIcon className="w-5 h-5" />
              {badgeCounts.notifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
              )}
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <Link
              href="/admin/profile"
              className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                AW
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">Admin Console</div>
                <div className="text-[10px] text-slate-500">Alexander Wright</div>
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${
                  isActive(item.href, item.key)
                    ? "bg-indigo-600 text-white font-medium"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.badgeColor || "bg-slate-700"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg mt-2"
            >
              <LogoutIcon className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        {/* Main View Container */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export * from "./AdminIcons";
