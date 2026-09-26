"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, NavigationItem } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export function PatientShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState<number>(0);
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    fetch("/api/patient/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.unreadCount === "number") {
          setUnreadNotifs(data.unreadCount);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/");
  };

  const patientNavItems: NavigationItem[] = [
    {
      label: "Dashboard",
      href: "/patient",
      isActive: pathname === "/patient",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: "Appointments",
      href: "/patient/appointments",
      isActive: pathname.startsWith("/patient/appointments"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "My Visits",
      href: "/patient/visits",
      isActive: pathname.startsWith("/patient/visits"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: "Prescriptions",
      href: "/patient/prescriptions",
      isActive: pathname.startsWith("/patient/prescriptions"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
    {
      label: "Lab Reports",
      href: "/patient/lab-reports",
      isActive: pathname.startsWith("/patient/lab-reports"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Medical Records",
      href: "/patient/medical-records",
      isActive: pathname.startsWith("/patient/medical-records"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Follow-ups",
      href: "/patient/follow-ups",
      isActive: pathname.startsWith("/patient/follow-ups"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: "Notifications",
      href: "/patient/notifications",
      badge: unreadNotifs > 0 ? String(unreadNotifs) : undefined,
      isActive: pathname.startsWith("/patient/notifications"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      label: "Profile",
      href: "/patient/profile",
      isActive: pathname.startsWith("/patient/profile"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      label: "Settings",
      href: "/patient/settings",
      isActive: pathname.startsWith("/patient/settings"),
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Shared Application Sidebar */}
      <Sidebar
        brandName="CareSync"
        brandSubtitle="Patient Portal"
        navigationItems={patientNavItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        footerSlot={
          <div className="space-y-1">
            <Link
              href="/patient/settings"
              className="flex items-center gap-3 px-4 py-2 rounded text-[#7c839b] hover:text-white hover:bg-white/5 text-[13px] font-medium transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help Center
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded text-[#7c839b] hover:text-[#ffdad6] hover:bg-red-950/20 text-[13px] font-medium transition-colors cursor-pointer text-left"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          title="CareSync"
          subtitle="Patient Workspace"
          onMenuToggle={() => setSidebarOpen(true)}
          searchSlot={
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#45464d]">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search records, appointments..."
                className="w-full bg-[#eff4ff] border-none rounded-full pl-9 pr-4 py-2 text-sm text-[#0b1c30] placeholder:text-[#45464d] focus:outline-none focus:ring-1 focus:ring-[#131b2e] transition-shadow"
              />
            </div>
          }
          actionsSlot={
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/patient/notifications"
                className="relative p-2 text-[#45464d] hover:text-[#0b1c30] rounded-full hover:bg-[#dce9ff]/50 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ef4444]" />
                )}
              </Link>

              <Link
                href="/patient/settings"
                className="hidden md:block p-2 text-[#45464d] hover:text-[#0b1c30] rounded-full hover:bg-[#dce9ff]/50 transition-colors cursor-pointer"
                aria-label="Help"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>

              <button
                type="button"
                className="p-2 text-[#45464d] hover:text-[#0b1c30] rounded-full hover:bg-[#dce9ff]/50 transition-colors cursor-pointer"
                aria-label="Toggle theme"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </button>

              <div className="w-px h-6 bg-[#e2e8f0] mx-2 hidden md:block" />
            </div>
          }
          userSlot={
            <Link href="/patient/profile" className="flex items-center gap-3 cursor-pointer group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAspWh8zA7jLKE83i4wk2SS4wQIrN5wj1XV4kM0Nqb0ukekZ3_NW9MYJwmuI5DIMNSoFv8cRFB_VMvEJH6Ob5ejj3QuNbBmvHrZvf5JW5v6QCaUrb6aw3fsDic4C8xI85RsOGCn1DJwVb6OStqfxK4iJZuH6scXxed7SV9jkRHhnLm23D6Z3t6mccK60K28MiLiq23NAHQZVXovrTOLfDkBimG7hRda_2PCV7A2040s-em_Ivprl-A3GQ"
                alt="Rahul K."
                className="w-9 h-9 rounded-full object-cover border border-[#e2e8f0] group-hover:border-[#131b2e] transition-colors shrink-0"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-[#0b1c30] leading-tight group-hover:text-primary transition-colors">
                  Rahul K.
                </p>
                <p className="text-xs text-[#45464d] leading-none mt-0.5">Patient</p>
              </div>
            </Link>
          }
        />

        {/* Page Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar - Stitch Pill Layout */}
      <nav
        className="fixed bottom-0 left-0 w-full z-40 md:hidden border-t border-[#e2e8f0] bg-white flex justify-around items-center h-16 px-2 shadow-[0_-4px_6px_-1px_rgba(15,23,42,0.05)]"
        aria-label="Mobile Navigation"
      >
        <Link
          href="/patient"
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-full text-xs transition-transform duration-150 ${
            pathname === "/patient"
              ? "bg-[#86f2e4] text-[#006f66] font-bold"
              : "text-[#45464d] hover:text-[#0b1c30]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Home
        </Link>

        <Link
          href="/patient/appointments"
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-full text-xs transition-transform duration-150 ${
            pathname.startsWith("/patient/appointments")
              ? "bg-[#86f2e4] text-[#006f66] font-bold"
              : "text-[#45464d] hover:text-[#0b1c30]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Calendar
        </Link>

        <Link
          href="/patient/medical-records"
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-full text-xs transition-transform duration-150 ${
            pathname.startsWith("/patient/medical-records")
              ? "bg-[#86f2e4] text-[#006f66] font-bold"
              : "text-[#45464d] hover:text-[#0b1c30]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Records
        </Link>

        <Link
          href="/patient/messages"
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-full text-xs transition-transform duration-150 ${
            pathname.startsWith("/patient/messages")
              ? "bg-[#86f2e4] text-[#006f66] font-bold"
              : "text-[#45464d] hover:text-[#0b1c30]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Messages
        </Link>

        <Link
          href="/patient/profile"
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-full text-xs transition-transform duration-150 ${
            pathname.startsWith("/patient/profile")
              ? "bg-[#86f2e4] text-[#006f66] font-bold"
              : "text-[#45464d] hover:text-[#0b1c30]"
          }`}
        >
          <svg className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </Link>
      </nav>
    </div>
  );
}
