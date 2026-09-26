"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconDashboard,
  IconRequests,
  IconSamples,
  IconTests,
  IconCompleted,
  IconNotifications,
  IconProfile,
  IconSettings,
  IconLogout,
  IconSearch,
  IconBarcode,
  IconFlask,
} from "./LabIcons";

interface LabShellProps {
  children: React.ReactNode;
}

export function LabShell({ children }: LabShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [technician, setTechnician] = useState<{
    name: string;
    email: string;
    station: string;
    avatar?: string;
  }>({
    name: "Arun Kumar",
    email: "arun.lab@caresync.com",
    station: "Diagnostic Station A-4",
  });

  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/lab/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.technician) {
            setTechnician({
              name: data.technician.name || "Arun Kumar",
              email: data.technician.email || "arun.lab@caresync.com",
              station: data.technician.station || "Diagnostic Station A-4",
              avatar: data.technician.avatar,
            });
          }
        }
      } catch (err) {
        console.error("Error loading technician session:", err);
      }
    }
    loadSession();
  }, []);

  const navLinks = [
    { label: "Dashboard", href: "/lab/dashboard", icon: IconDashboard },
    { label: "Lab Requests", href: "/lab/requests", icon: IconRequests },
    { label: "Samples", href: "/lab/samples", icon: IconSamples },
    { label: "Tests & Results", href: "/lab/tests", icon: IconTests },
    { label: "Completed Tests", href: "/lab/completed", icon: IconCompleted },
    { label: "Notifications", href: "/lab/notifications", icon: IconNotifications, badge: unreadNotifications },
  ];

  const bottomLinks = [
    { label: "Profile", href: "/lab/profile", icon: IconProfile },
    { label: "Settings", href: "/lab/settings", icon: IconSettings },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/login");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/lab/requests?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased flex">
      {/* 260px Navy Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-inverse-surface z-50 flex flex-col justify-between select-none shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo & Brand Header */}
          <div className="h-[64px] px-4 flex items-center gap-3 bg-inverse-surface border-b border-outline/20">
            <div className="w-8 h-8 rounded-lg bg-primary-container text-white flex items-center justify-center font-bold text-sm shrink-0">
              <IconFlask className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-base text-surface-container-lowest font-bold leading-tight tracking-tight">
                CareSync
              </span>
              <span className="text-[10px] text-outline-variant font-medium tracking-wider uppercase">
                CARE. CONNECT. CURE.
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/lab/dashboard" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                    isActive
                      ? "bg-primary-container text-white font-semibold shadow-sm"
                      : "text-outline-variant hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </div>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive
                          ? "bg-white text-primary-container"
                          : "bg-error text-white"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 pb-1">
              <div className="h-px bg-outline/20 w-full" />
            </div>

            {bottomLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                    isActive
                      ? "bg-primary-container text-white font-semibold shadow-sm"
                      : "text-outline-variant hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-3 bg-inverse-surface border-t border-outline/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-outline-variant hover:bg-error/15 hover:text-error transition-colors text-sm font-medium"
          >
            <IconLogout className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-[260px] flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="fixed top-0 left-[260px] right-0 h-[64px] bg-white z-40 flex items-center justify-between px-6 border-b border-outline-variant/30 shadow-[0_1px_4px_rgba(15,23,42,0.05)]">
          {/* Breadcrumb / Station Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary font-medium">Clinical Lab Portal</span>
            <span className="text-outline text-xs">•</span>
            <span className="text-sm font-semibold text-on-surface">{technician.station}</span>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-6 hidden md:block">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary">
                <IconSearch className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, test, or sample ID..."
                className="w-full pl-9 pr-4 py-1.5 bg-surface-container-low text-xs text-on-surface placeholder:text-outline rounded-xl outline-none focus:bg-white focus:ring-1 focus:ring-primary-container border border-transparent focus:border-primary-container transition-all"
              />
            </div>
          </form>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            <Link
              href="/lab/samples"
              className="inline-flex items-center gap-1.5 bg-primary-container hover:bg-primary text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <IconBarcode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan Sample</span>
            </Link>

            <Link
              href="/lab/notifications"
              className="relative p-2 text-secondary hover:text-on-surface hover:bg-surface-container-low rounded-xl transition-colors"
            >
              <IconNotifications className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-white"></span>
              )}
            </Link>

            <div className="h-6 w-px bg-outline-variant/40" />

            {/* User Profile Pill */}
            <Link
              href="/lab/profile"
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-surface-container-low transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs ring-1 ring-outline-variant/30 shrink-0">
                {technician.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="flex flex-col text-left hidden sm:flex">
                <span className="text-xs font-semibold text-on-surface leading-tight">
                  {technician.name}
                </span>
                <span className="text-[10px] text-primary font-medium leading-none mt-0.5">
                  Lab Technician
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Body */}
        <main className="relative pt-[64px] min-h-screen bg-surface px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
