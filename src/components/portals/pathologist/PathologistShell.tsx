"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  ReportsIcon,
  VerifiedIcon,
  PatientsIcon,
  BellIcon,
  UserIcon,
  SettingsIcon,
  LogoutIcon,
  MicroscopeIcon,
} from "./PathologistIcons";

interface PathologistShellProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export function PathologistShell({ children, activeRoute }: PathologistShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const navItems = [
    {
      label: "Dashboard",
      href: "/pathologist/dashboard",
      icon: <DashboardIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      label: "Reports",
      href: "/pathologist/reports",
      icon: <ReportsIcon className="w-5 h-5 shrink-0" />,
      badge: badgeCounts.awaiting > 0 ? badgeCounts.awaiting : null,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      label: "Verified Reports",
      href: "/pathologist/verified",
      icon: <VerifiedIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      label: "Patients",
      href: "/pathologist/patients",
      icon: <PatientsIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      label: "Notifications",
      href: "/pathologist/notifications",
      icon: <BellIcon className="w-5 h-5 shrink-0" />,
      badge: badgeCounts.notifications > 0 ? badgeCounts.notifications : null,
      badgeColor: "bg-red-500 text-white",
    },
    {
      label: "Profile",
      href: "/pathologist/profile",
      icon: <UserIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      label: "Settings",
      href: "/pathologist/settings",
      icon: <SettingsIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0d1c2d] flex flex-col lg:flex-row font-sans selection:bg-[#00355f] selection:text-white">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden lg:flex lg:w-64 xl:w-72 bg-[#002444] text-white flex-col justify-between shrink-0 border-r border-white/10 select-none">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-white/10">
            <Link href="/pathologist/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#94f2ef]/20 to-[#006a68] border border-[#94f2ef]/30 flex items-center justify-center text-[#94f2ef] shadow-inner">
                <MicroscopeIcon className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white block leading-none">
                  CareSync
                </span>
                <span className="text-[11px] uppercase tracking-wider text-[#94f2ef] font-semibold block mt-1">
                  Pathology Portal
                </span>
              </div>
            </Link>

            {/* Pathologist Identity Pill */}
            <div className="mt-5 p-3 rounded-xl bg-white/[0.06] border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#00355f] border border-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                SP
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">Dr. Sunita Patil, MD</div>
                <div className="text-[10px] text-slate-300 truncate">Board Certified Pathologist</div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1">
            {navItems.map((item) => {
              const isActive =
                activeRoute === item.label ||
                pathname === item.href ||
                (item.href !== "/pathologist/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#00355f] text-white font-semibold shadow-sm border border-white/10"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? "text-[#94f2ef]" : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        item.badgeColor || "bg-blue-600 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer & Logout */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-rose-300 hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-800/30"
          >
            <LogoutIcon className="w-5 h-5 text-slate-400 group-hover:text-rose-400" />
            <span>Logout</span>
          </button>
          <div className="text-[10px] text-slate-400 text-center pt-2">
            CareSync LIS • Pathology v2.6.0
          </div>
        </div>
      </aside>

      {/* ================= MOBILE HEADER & DRAWER ================= */}
      <div className="lg:hidden bg-[#002444] text-white border-b border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/pathologist/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#006a68] text-[#94f2ef] flex items-center justify-center">
            <MicroscopeIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-white block leading-tight">CareSync</span>
            <span className="text-[9px] uppercase tracking-wider text-[#94f2ef] font-semibold">
              Pathologist Portal
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/[0.08] text-slate-200 hover:text-white"
          aria-label="Toggle Navigation"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#002444] text-white border-b border-white/10 px-4 py-4 space-y-1 z-40 animate-fadeIn">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm text-slate-200 hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm text-rose-300 hover:bg-rose-950/30"
          >
            <LogoutIcon className="w-5 h-5 text-rose-400" />
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">{children}</main>
    </div>
  );
}
