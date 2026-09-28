"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  RequestsIcon,
  SamplesIcon,
  TestsIcon,
  CompletedIcon,
  NotificationsIcon,
  ProfileIcon,
  SettingsIcon,
  LogoutIcon,
  SearchIcon,
  CloseIcon,
  BarcodeIcon,
} from "./LabIcons";

interface LabShellProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.FC<{ size?: number; className?: string }>;
  activeCheck?: (p: string) => boolean;
  badge?: number;
}

export const LabShell: React.FC<LabShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [samplesPendingCount, setSamplesPendingCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [technicianData, setTechnicianData] = useState<any>({
    name: "Vikram Malhotra",
    role: "Medical Laboratory Technologist (MLT)",
    station: "Station 2 • Central Diagnostic Lab",
  });

  // Fetch header profile and badge metrics
  useEffect(() => {
    async function loadLabHeader() {
      try {
        const [dashRes, notifRes, profileRes] = await Promise.all([
          fetch("/api/lab/dashboard"),
          fetch("/api/lab/notifications"),
          fetch("/api/lab/profile"),
        ]);

        if (dashRes.ok) {
          const d = await dashRes.json();
          if (d.metrics) {
            setPendingRequestsCount(d.metrics.newRequests || 0);
            setSamplesPendingCount(d.metrics.samplesPending || 0);
          }
        }
        if (notifRes.ok) {
          const n = await notifRes.json();
          if (typeof n.unreadCount === "number") {
            setUnreadNotifications(n.unreadCount);
          }
        }
        if (profileRes.ok) {
          const p = await profileRes.json();
          if (p.user) setTechnicianData(p.user);
        }
      } catch (err) {
        console.error("Lab shell header fetch error:", err);
      }
    }
    loadLabHeader();
  }, [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/lab/requests?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/auth/login");
  };

  // Exactly matching the prompt sidebar specification
  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/lab/dashboard",
      icon: DashboardIcon,
    },
    {
      label: "Requests",
      href: "/lab/requests",
      icon: RequestsIcon,
      activeCheck: (p) => p.startsWith("/lab/requests"),
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined,
    },
    {
      label: "Samples",
      href: "/lab/samples",
      icon: SamplesIcon,
      activeCheck: (p) => p.startsWith("/lab/samples"),
      badge: samplesPendingCount > 0 ? samplesPendingCount : undefined,
    },
    {
      label: "Tests",
      href: "/lab/tests",
      icon: TestsIcon,
      activeCheck: (p) => p.startsWith("/lab/tests"),
    },
    {
      label: "Completed",
      href: "/lab/completed",
      icon: CompletedIcon,
      activeCheck: (p) => p.startsWith("/lab/completed"),
    },
    {
      label: "Notifications",
      href: "/lab/notifications",
      icon: NotificationsIcon,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    {
      label: "Profile",
      href: "/lab/profile",
      icon: ProfileIcon,
    },
    {
      label: "Settings",
      href: "/lab/settings",
      icon: SettingsIcon,
    },
  ];

  const isItemActive = (item: NavItem) => {
    if (item.activeCheck) return item.activeCheck(pathname);
    return pathname === item.href;
  };

  return (
    <div className="bg-[#f8f9fe] text-[#191c1f] min-h-screen flex font-sans antialiased">
      {/* DESKTOP SIDEBAR - Matches Stitch Deep Medical Navy (#00355f) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#00355f] text-white z-50 flex-col justify-between select-none shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand header */}
          <div className="h-16 px-4 flex items-center gap-2.5 bg-[#00355f] border-b border-[#0f4c81]/40 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#006a68] flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 4v16m-8-8h16" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base text-white tracking-tight font-bold truncate leading-none">
                CareSync
              </span>
              <span className="text-[10px] text-[#a0c9ff] uppercase tracking-wider mt-1 font-semibold">
                LAB WORKSTATION
              </span>
            </div>
          </div>

          {/* Navigation links matching prompt */}
          <div className="px-3 py-4 flex flex-col gap-1 overflow-y-auto flex-1">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-[#0f4c81] text-white shadow-xs font-semibold"
                        : "text-[#d2e4ff] hover:bg-[#0f4c81]/60 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={18}
                        className={active ? "text-white" : "text-[#a0c9ff]"}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full bg-[#91f0ec] text-[#00201f] text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="flex flex-col gap-1 pt-3 mt-auto border-t border-[#0f4c81]/40">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#d2e4ff] hover:bg-rose-900/40 hover:text-rose-200 transition-all text-left"
              >
                <LogoutIcon size={18} className="text-[#a0c9ff]" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Technician Card */}
        <div className="p-3 border-t border-[#0f4c81]/40 flex-shrink-0">
          <Link
            href="/lab/profile"
            className="p-2.5 rounded-xl bg-[#0f4c81]/60 hover:bg-[#0f4c81]/90 transition-colors flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-[#006a68] flex items-center justify-center text-white font-bold text-xs ring-1 ring-[#a0c9ff]/40 flex-shrink-0">
              VM
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-white truncate font-semibold leading-tight">
                {technicianData.name || "Vikram Malhotra"}
              </span>
              <span className="text-[11px] text-[#a0c9ff] truncate leading-tight mt-0.5">
                Lab Technologist (MLT)
              </span>
              <span className="text-[9px] text-[#91f0ec] truncate leading-tight font-semibold mt-0.5">
                Station 2 • Pathology Lab
              </span>
            </div>
          </Link>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-[#00355f] text-white flex flex-col justify-between z-10 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#0f4c81]/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#006a68] flex items-center justify-center text-white font-bold text-xs">
                  CS
                </div>
                <span className="font-bold text-white text-base">
                  CareSync Lab
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-white p-1"
                aria-label="Close navigation"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <nav className="flex flex-col gap-1 py-4 flex-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                      active
                        ? "bg-[#0f4c81] text-white font-semibold"
                        : "text-[#d2e4ff] hover:bg-[#0f4c81]/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full bg-[#91f0ec] text-[#00201f] text-[10px] font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-[#0f4c81]/40">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-200 hover:bg-rose-900/40 w-full"
              >
                <LogoutIcon size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* TOP WORKSTATION STATUS BAR */}
        <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/90 flex items-center justify-between sticky top-0 z-40 shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Open mobile menu"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Global Search by Sample ID / Barcode / Patient */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md hidden sm:block">
              <SearchIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by Sample ID (SMP-...), Barcode, MRN, or Patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#f8f9fe] border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0f4c81] focus:bg-white transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick barcode indicator */}
            <Link
              href="/lab/samples"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-[#006a68] text-[11px] font-semibold hover:bg-teal-100 transition-colors"
              title="Barcode Scanner Ready"
            >
              <BarcodeIcon size={14} className="text-[#006a68]" />
              <span>Scanner Ready</span>
            </Link>

            {/* Notification Bell */}
            <Link
              href="/lab/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <NotificationsIcon size={18} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
              )}
            </Link>

            {/* Technician Station Chip */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-600 font-medium">Station 2 Phlebotomy &amp; Biochemistry</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
