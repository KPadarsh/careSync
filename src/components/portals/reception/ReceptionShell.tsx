"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "./ReceptionIcons";

interface ReceptionShellProps {
  children: React.ReactNode;
  activeTab?: string;
}

export function ReceptionShell({ children }: ReceptionShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Fetch unread notification count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const res = await fetch("/api/reception/notifications?unread=true");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // silently fallback
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/reception/dashboard", icon: Icons.Dashboard },
    { label: "Patients", href: "/reception/patients", icon: Icons.Patients },
    { label: "Appointments", href: "/reception/appointments", icon: Icons.Appointments },
    { label: "Queue", href: "/reception/queue", icon: Icons.Queue, badge: "Live" },
    { label: "Walk-ins", href: "/reception/walk-ins", icon: Icons.WalkIns },
    { label: "Follow-ups", href: "/reception/follow-ups", icon: Icons.FollowUps },
    {
      label: "Notifications",
      href: "/reception/notifications",
      icon: Icons.Notifications,
      count: unreadCount,
    },
    { label: "Profile", href: "/reception/profile", icon: Icons.Profile },
    { label: "Settings", href: "/reception/settings", icon: Icons.Settings },
  ];

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
      router.push("/login");
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden">
      {/* MOBILE DRAWER BACKDROP */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-[#00355f] text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* BRAND HEADER */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 bg-[#002d52]">
          <Link href="/reception/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              C
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">
                CareSync
              </span>
              <span className="block text-[10px] tracking-wider uppercase text-teal-300 font-medium">
                Reception Portal
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-1 rounded text-white/70 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* TERMINAL STATUS BADGE */}
        <div className="px-5 py-2.5 bg-black/15 border-b border-white/5 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white/90">Station 01</span>
          </div>
          <span className="text-[11px] text-teal-200/80">Main Entrance</span>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/reception/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#006a68] text-white shadow-xs font-semibold"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? "text-teal-200" : "text-white/60"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-teal-400 text-teal-950">
                    {item.badge}
                  </span>
                )}
                {typeof item.count === "number" && item.count > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-500 text-white">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER & USER PROFILE */}
        <div className="p-3 border-t border-white/10 bg-[#002a4d]">
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors">
            <Link
              href="/reception/profile"
              className="flex items-center gap-2.5 min-w-0 flex-1"
            >
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white/20 shrink-0">
                SA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  Sarah Adams
                </p>
                <p className="text-[10px] text-teal-300 truncate">
                  Front Desk Lead
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-white/60 hover:text-rose-300 hover:bg-white/10 rounded transition-colors shrink-0"
              aria-label="Logout"
            >
              <Icons.Logout className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-7 shrink-0 z-10 shadow-xs">
          {/* LEFT: MOBILE TOGGLE & SEARCH */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Icons.Menu className="w-5 h-5" />
            </button>

            {/* QUICK PATIENT / BOOKING SEARCH */}
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Icons.Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, MRN, or phone (Press Enter)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 border border-transparent rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all outline-hidden"
              />
            </form>
          </div>

          {/* RIGHT: CLOCK & ACTIONS */}
          <div className="flex items-center gap-3 shrink-0">
            {/* LIVE DIGITAL CLOCK */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
              <Icons.Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{currentTime}</span>
            </div>

            {/* QUICK APPOINTMENT BTN */}
            <Link
              href="/reception/appointments/new"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#00355f] hover:bg-[#002644] rounded-lg shadow-xs transition-colors"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              <span>Book Appointment</span>
            </Link>

            {/* QUICK WALK-IN BTN */}
            <Link
              href="/reception/walk-ins"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs transition-colors"
            >
              <Icons.WalkIns className="w-3.5 h-3.5" />
              <span>+ Walk-in</span>
            </Link>

            {/* NOTIFICATIONS BELL */}
            <Link
              href="/reception/notifications"
              className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Icons.Notifications className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>

            {/* AVATAR LINK */}
            <Link
              href="/reception/profile"
              className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-slate-100"
            >
              SA
            </Link>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
