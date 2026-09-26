"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  QueueIcon,
  PatientsIcon,
  ConsultationIcon,
  LabIcon,
  PrescriptionsIcon,
  RecordsIcon,
  FollowUpsIcon,
  NotificationsIcon,
  ProfileIcon,
  SettingsIcon,
  LogoutIcon,
  SearchIcon,
  CloseIcon,
  StethoscopeIcon,
} from "./DoctorIcons";

interface DoctorShellProps {
  children: React.ReactNode;
}

export const DoctorShell: React.FC<DoctorShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [queueCount, setQueueCount] = useState<number>(3);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(2);
  const [doctorInfo, setDoctorInfo] = useState({
    name: "Dr. Anil Kumar, MD",
    specialty: "Cardiology",
    room: "Room 302",
    avatar:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
  });

  useEffect(() => {
    // Fetch live operational indicators
    async function loadStats() {
      try {
        const res = await fetch("/api/doctor/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data.stats?.waitingCount !== undefined) {
            setQueueCount(data.stats.waitingCount);
          }
          if (data.doctor) {
            setDoctorInfo({
              name: `${data.doctor.name}${data.doctor.qualification ? `, ${data.doctor.qualification}` : ""}`,
              specialty: data.doctor.specialty || "Cardiology",
              room: data.doctor.roomNumber || "Room 302",
              avatar: data.doctor.avatar || doctorInfo.avatar,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load doctor shell stats:", err);
      }
    }
    loadStats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      router.push(`/doctor/patients?search=${encodeURIComponent(globalSearch.trim())}`);
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

  const mainNavItems = [
    {
      label: "Dashboard",
      href: "/doctor/dashboard",
      icon: <DashboardIcon className="w-5 h-5 shrink-0" />,
      active: pathname === "/doctor/dashboard" || pathname === "/doctor",
    },
    {
      label: "Queue",
      href: "/doctor/queue",
      icon: <QueueIcon className="w-5 h-5 shrink-0" />,
      badge: queueCount > 0 ? queueCount : undefined,
      active: pathname.startsWith("/doctor/queue"),
    },
    {
      label: "Patients",
      href: "/doctor/patients",
      icon: <PatientsIcon className="w-5 h-5 shrink-0" />,
      active: pathname.startsWith("/doctor/patients"),
    },
    {
      label: "Consultations",
      href: "/doctor/queue",
      icon: <ConsultationIcon className="w-5 h-5 shrink-0" />,
      active: pathname.startsWith("/doctor/consultations"),
    },
    {
      label: "Lab",
      href: "/doctor/lab",
      icon: <LabIcon className="w-5 h-5 shrink-0" />,
      active: pathname.startsWith("/doctor/lab"),
    },
    {
      label: "Prescriptions",
      href: "/doctor/prescriptions",
      icon: <PrescriptionsIcon className="w-5 h-5 shrink-0" />,
      active: pathname.startsWith("/doctor/prescriptions"),
    },
    {
      label: "Records",
      href: "/doctor/records",
      icon: <RecordsIcon className="w-5 h-5 shrink-0" />,
      active: pathname.startsWith("/doctor/records"),
    },
    {
      label: "Follow-ups",
      href: "/doctor/follow-ups",
      icon: <FollowUpsIcon className="w-5 h-5 shrink-0" />,
      active: pathname.startsWith("/doctor/follow-ups"),
    },
  ];

  const bottomNavItems = [
    {
      label: "Notifications",
      href: "/doctor/notifications",
      icon: <NotificationsIcon className="w-5 h-5 shrink-0" />,
      badge: unreadNotifs > 0 ? unreadNotifs : undefined,
      active: pathname.startsWith("/doctor/notifications"),
    },
    {
      label: "Profile",
      href: "/doctor/profile",
      icon: <ProfileIcon className="w-5 h-5 shrink-0" />,
      active: pathname.startsWith("/doctor/profile"),
    },
    {
      label: "Settings",
      href: "/doctor/settings",
      icon: <SettingsIcon className="w-5 h-5 shrink-0" />,
      active: pathname.startsWith("/doctor/settings"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
      {/* SIDEBAR: Desktop 240px (16rem / w-64) navy sidebar (#213145) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#213145] text-white z-50 hidden lg:flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.08)] select-none">
        <div className="flex flex-col">
          {/* Logo & Brand Header */}
          <div className="h-16 px-5 flex items-center gap-3 border-b border-white/10">
            <div className="w-9 h-9 rounded-lg bg-[#006194] flex items-center justify-center text-white shadow-sm shrink-0">
              <StethoscopeIcon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[17px] font-bold tracking-tight text-white leading-none">
                CareSync
              </span>
              <span className="text-[10px] text-[#93ccff] tracking-widest uppercase mt-1 leading-none font-medium">
                Care. Connect. Cure.
              </span>
            </div>
          </div>

          <div className="px-4 py-2 mt-2">
            <span className="text-[11px] font-semibold text-[#8ca0be] tracking-wider uppercase px-2">
              Clinical Rail
            </span>
          </div>

          {/* Main Navigation Links */}
          <nav className="px-3 flex flex-col gap-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  item.active
                    ? "bg-[#006194] text-white font-semibold shadow-sm"
                    : "text-[#bec6e0] hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.active
                        ? "bg-white text-[#006194]"
                        : "bg-[#00873a] text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom Utility Navigation & Logout */}
        <div className="p-3 border-t border-white/10 flex flex-col gap-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                item.active
                  ? "bg-[#006194] text-white font-semibold"
                  : "text-[#bec6e0] hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 rounded-full bg-[#ba1a1a] text-white text-[11px] font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            type="button"
            className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-[13px] font-medium text-[#ffdad6] hover:bg-[#ba1a1a]/20 hover:text-white transition-all text-left w-full"
          >
            <LogoutIcon className="w-5 h-5 shrink-0 text-[#ffdad6]" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-[#213145] text-white p-4 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="flex flex-col">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#006194] flex items-center justify-center text-white">
                    <StethoscopeIcon className="w-5 h-5" />
                  </div>
                  <span className="text-lg font-bold text-white">CareSync Doctor</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1 mt-4">
                {mainNavItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${
                      item.active
                        ? "bg-[#006194] text-white font-semibold"
                        : "text-[#bec6e0] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#00873a] text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="pt-4 border-t border-white/10 flex flex-col gap-1">
              {bottomNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#bec6e0] hover:bg-white/10 hover:text-white"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg text-sm text-[#ffdad6] hover:bg-[#ba1a1a]/20"
              >
                <LogoutIcon className="w-5 h-5 text-[#ffdad6]" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* HEADER: Fixed top bar */}
        <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-[#bfc7d2]/40 z-40 px-4 md:px-6 flex items-center justify-between shadow-[0_1px_4px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-[#565e74] hover:bg-[#eff4ff] lg:hidden"
            >
              <svg className="w-6 h-6 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-[#0b1c30]">
                  Clinical Dashboard
                </span>
                <span className="w-1 h-1 rounded-full bg-[#bfc7d2]" />
                <span className="text-[12px] text-[#565e74]">
                  Metro Health Clinic • {doctorInfo.room}
                </span>
              </div>
            </div>
          </div>

          {/* Center Search Input */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex relative w-72 lg:w-80"
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#707881]">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search patient by name or ID..."
              className="w-full h-9 pl-9 pr-4 bg-[#eff4ff] border border-[#bfc7d2]/50 rounded-lg text-[13px] text-[#0b1c30] placeholder:text-[#707881] focus:outline-none focus:border-[#006194] focus:ring-1 focus:ring-[#006194]/20 transition-all"
            />
          </form>

          {/* Right User & Status Area */}
          <div className="flex items-center gap-4">
            <Link
              href="/doctor/notifications"
              className="relative p-2 rounded-lg text-[#565e74] hover:bg-[#eff4ff] hover:text-[#0b1c30] transition-colors"
            >
              <NotificationsIcon className="w-5 h-5" />
              {unreadNotifs > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-white" />
              )}
            </Link>

            <div className="h-5 w-px bg-[#bfc7d2]/40 hidden sm:block" />

            {/* Live On Duty Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#7ffc97]/30 border border-[#62df7d]/40 text-[#005320]">
              <span className="w-2 h-2 rounded-full bg-[#006b2c] animate-pulse" />
              <span className="text-[11px] font-semibold tracking-wide">On Duty</span>
            </div>

            {/* Doctor Avatar & Identity */}
            <Link
              href="/doctor/profile"
              className="flex items-center gap-3 pl-2 sm:border-l sm:border-[#bfc7d2]/40"
            >
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-[14px] font-semibold text-[#0b1c30] leading-tight">
                  {doctorInfo.name}
                </span>
                <span className="text-[11px] text-[#565e74] leading-tight">
                  {doctorInfo.specialty}
                </span>
              </div>
              <img
                src={doctorInfo.avatar}
                alt={doctorInfo.name}
                className="w-8 h-8 rounded-full object-cover ring-1 ring-[#bfc7d2]/40 shadow-xs"
              />
            </Link>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="relative pt-16 min-h-screen bg-[#f8f9ff]">
          {children}
        </main>
      </div>
    </div>
  );
};
