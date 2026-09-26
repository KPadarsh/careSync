"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  QueueIcon,
  PatientsIcon,
  VitalsIcon,
  AssessmentIcon,
  RecordsIcon,
  TasksIcon,
  NotificationsIcon,
  ProfileIcon,
  SettingsIcon,
  LogoutIcon,
  SearchIcon,
  CloseIcon,
  ChevronDownIcon,
} from "./NurseIcons";

interface NurseShellProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  activeCheck?: (p: string) => boolean;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NurseShell: React.FC<NurseShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [nurseData, setNurseData] = useState<any>({
    name: "Arun Mary",
    role: "Staff Nurse",
    department: "Cardiology Triage",
    station: "Triage Bay 3A",
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch nurse profile and unread count
  useEffect(() => {
    async function loadNurseHeader() {
      try {
        const [profileRes, notifRes] = await Promise.all([
          fetch("/api/nurse/profile"),
          fetch("/api/nurse/notifications"),
        ]);
        if (profileRes.ok) {
          const p = await profileRes.json();
          if (p.user) setNurseData(p.user);
        }
        if (notifRes.ok) {
          const n = await notifRes.json();
          if (typeof n.unreadCount === "number") setUnreadNotifications(n.unreadCount);
        }
      } catch (err) {
        console.error("Nurse header fetch error:", err);
      }
    }
    loadNurseHeader();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/nurse/patients?search=${encodeURIComponent(searchQuery.trim())}`);
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

  const navGroups: NavGroup[] = [
    {
      group: "MAIN",
      items: [
        { label: "Dashboard", href: "/nurse/dashboard", icon: DashboardIcon },
        { label: "Patient Queue", href: "/nurse/queue", icon: QueueIcon },
        { label: "Patients", href: "/nurse/patients", icon: PatientsIcon },
        {
          label: "Vitals",
          href: pathname.startsWith("/nurse/vitals") ? pathname : "/nurse/vitals/demo",
          activeCheck: (p: string) => p.startsWith("/nurse/vitals"),
          icon: VitalsIcon,
        },
        {
          label: "Assessment",
          href: pathname.startsWith("/nurse/assessments") ? pathname : "/nurse/assessments/demo",
          activeCheck: (p: string) => p.startsWith("/nurse/assessments"),
          icon: AssessmentIcon,
        },
        {
          label: "Nursing Records",
          href: "/nurse/records",
          activeCheck: (p: string) => p.startsWith("/nurse/records"),
          icon: RecordsIcon,
        },
        { label: "Tasks", href: "/nurse/tasks", icon: TasksIcon },
      ],
    },
    {
      group: "COMMUNICATION",
      items: [
        {
          label: "Notifications",
          href: "/nurse/notifications",
          icon: NotificationsIcon,
          badge: unreadNotifications > 0 ? unreadNotifications : undefined,
        },
      ],
    },
    {
      group: "ACCOUNT",
      items: [
        { label: "Profile", href: "/nurse/profile", icon: ProfileIcon },
        { label: "Settings", href: "/nurse/settings", icon: SettingsIcon },
      ],
    },
  ];

  const isItemActive = (item: any) => {
    if (item.activeCheck) return item.activeCheck(pathname);
    return pathname === item.href;
  };

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex font-sans antialiased">
      {/* DESKTOP SIDEBAR - Matches Stitch Deep Medical Navy (#00355f) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[#00355f] text-white z-50 flex-col justify-between select-none shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand header */}
          <div className="h-16 px-4 flex items-center gap-2.5 bg-[#00355f] border-b border-[#0f4c81]/40 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#006a61] flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 4v16m-8-8h16" />
              </svg>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-base text-white tracking-tight font-bold truncate leading-none">CareSync</span>
              <span className="text-[10px] text-[#a0c9ff] uppercase tracking-wider mt-1 font-semibold">
                NURSE WORKSTATION
              </span>
            </div>
          </div>

          {/* Nav links */}
          <div className="px-3 py-4 flex flex-col gap-5 overflow-y-auto flex-1">
            {navGroups.map((grp) => (
              <div key={grp.group} className="flex flex-col gap-1">
                <span className="px-2 text-[10px] font-bold text-[#a0c9ff]/70 uppercase tracking-wider">
                  {grp.group}
                </span>
                <nav className="flex flex-col gap-1">
                  {grp.items.map((item) => {
                    const active = isItemActive(item);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                          active
                            ? "bg-[#0f4c81] text-white shadow-sm font-semibold"
                            : "text-[#d2e4ff] hover:bg-[#0f4c81]/70 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon size={18} className={active ? "text-white" : "text-[#a0c9ff]"} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded-full bg-[#86f2e4] text-[#00201d] text-[10px] font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}

            {/* Logout button */}
            <div className="flex flex-col gap-1 pt-2 border-t border-[#0f4c81]/40">
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-[#d2e4ff] hover:bg-rose-900/40 hover:text-rose-200 transition-all text-left"
              >
                <LogoutIcon size={18} className="text-[#a0c9ff]" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Nurse Mini Card */}
        <div className="p-3 border-t border-[#0f4c81]/40 flex-shrink-0">
          <Link
            href="/nurse/profile"
            className="p-2 rounded-xl bg-[#0f4c81]/60 hover:bg-[#0f4c81]/90 transition-colors flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs ring-1 ring-[#a0c9ff]/40 flex-shrink-0">
              AM
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs text-white truncate font-semibold leading-tight">
                {nurseData.name || "Arun Mary"}
              </span>
              <span className="text-[11px] text-[#a0c9ff] truncate leading-tight mt-0.5">Staff Nurse</span>
              <span className="text-[9px] text-[#86f2e4] truncate leading-tight font-semibold mt-0.5">
                Cardiology Triage
              </span>
            </div>
          </Link>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 bg-[#00355f] text-white flex flex-col justify-between z-10 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-[#0f4c81]/40">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#006a61] flex items-center justify-center text-white font-bold text-xs">
                  CS
                </div>
                <span className="font-bold text-white text-base">CareSync Nurse</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-white/80 hover:text-white"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {navGroups.map((grp) => (
                <div key={grp.group} className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#a0c9ff]/70 uppercase">{grp.group}</span>
                  {grp.items.map((item) => {
                    const active = isItemActive(item);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium ${
                          active ? "bg-[#0f4c81] text-white" : "text-[#d2e4ff]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded-full bg-[#86f2e4] text-[#00201d] text-xs font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-rose-300 hover:bg-rose-900/30"
            >
              <LogoutIcon size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* TOP HEADER */}
        <header className="sticky top-0 h-16 bg-white border-b border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] z-40 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Global Patient Search */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient by name, MRN, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-[#eff4ff] border border-slate-200 rounded-lg text-xs lg:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0f4c81] focus:bg-white transition-all"
              />
            </form>
          </div>

          <div className="flex items-center gap-3 lg:gap-5">
            {/* Live shift badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              Live Shift • Station 3A
            </div>

            {/* Notification Bell */}
            <Link
              href="/nurse/notifications"
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <NotificationsIcon size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white"></span>
              )}
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            {/* Profile pill */}
            <Link href="/nurse/profile" className="flex items-center gap-2.5 group cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-[#00355f] text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-200">
                AM
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 group-hover:text-[#00355f] transition-colors">
                  {nurseData.name || "Arun Mary"}
                </span>
                <span className="text-[11px] text-slate-500 leading-tight">Staff Nurse (Triage)</span>
              </div>
              <ChevronDownIcon size={14} className="text-slate-400 group-hover:text-slate-700 hidden sm:block" />
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 lg:p-6 bg-[#f8f9ff] overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
