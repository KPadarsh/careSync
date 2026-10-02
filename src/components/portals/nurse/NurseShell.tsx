"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import { AppShell, AppNavSection } from "@/components/layout/AppShell";
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
  SearchIcon,
} from "./NurseIcons";

interface NurseShellProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export const NurseShell: React.FC<NurseShellProps> = ({ children, activeRoute }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const { unreadCount: liveUnreadCount } = useNotifications();
  const [nurseData, setNurseData] = useState<{
    name: string;
    role: string;
    department: string;
    station: string;
  }>({
    name: "Staff Nurse",
    role: "Staff Nurse",
    department: "Triage & Vitals",
    station: "Station Alpha",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const unreadNotifications = liveUnreadCount;

  useEffect(() => {
    async function loadNurseHeader() {
      try {
        const profileRes = await fetch("/api/nurse/profile");
        if (profileRes.ok) {
          const p = await profileRes.json();
          if (p.user) {
            setNurseData({
              name: p.user.name || "Staff Nurse",
              role: p.user.role || "Staff Nurse",
              department: p.user.department || "Triage & Vitals",
              station: p.user.station || "Station Alpha",
            });
          }
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
    router.push("/");
  };

  const navigationSections: AppNavSection[] = [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
          href: "/nurse/dashboard",
          icon: <DashboardIcon className="w-4 h-4" />,
          active: pathname === "/nurse/dashboard" || pathname === "/nurse",
        },
        {
          label: "Triage Queue",
          href: "/nurse/queue",
          icon: <QueueIcon className="w-4 h-4" />,
          active: pathname.startsWith("/nurse/queue"),
        },
        {
          label: "Patients",
          href: "/nurse/patients",
          icon: <PatientsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/nurse/patients"),
        },
      ],
    },
    {
      title: "Clinical Nursing",
      items: [
        {
          label: "Patient Vitals",
          href: pathname.startsWith("/nurse/vitals") ? pathname : "/nurse/queue",
          icon: <VitalsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/nurse/vitals"),
        },
        {
          label: "Assessments",
          href: pathname.startsWith("/nurse/assessments") ? pathname : "/nurse/queue",
          icon: <AssessmentIcon className="w-4 h-4" />,
          active: pathname.startsWith("/nurse/assessments"),
        },
        {
          label: "Nursing Records",
          href: "/nurse/records",
          icon: <RecordsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/nurse/records"),
        },
        {
          label: "Daily Tasks",
          href: "/nurse/tasks",
          icon: <TasksIcon className="w-4 h-4" />,
          active: pathname.startsWith("/nurse/tasks"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Notifications",
          href: "/nurse/notifications",
          icon: <NotificationsIcon className="w-4 h-4" />,
          badge: unreadNotifications > 0 ? unreadNotifications : null,
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
          active: pathname.startsWith("/nurse/notifications"),
        },
        {
          label: "Profile",
          href: "/nurse/profile",
          icon: <ProfileIcon className="w-4 h-4" />,
          active: pathname.startsWith("/nurse/profile"),
        },
        {
          label: "Settings",
          href: "/nurse/settings",
          icon: <SettingsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/nurse/settings"),
        },
      ],
    },
  ];

  return (
    <AppShell
      brandName="CareSync"
      brandTagline="Nursing Station"
      brandBadge="NURSE"
      badgeColorClass="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
      brandIcon={
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <VitalsIcon className="w-4 h-4" />
        </div>
      }
      navigationSections={navigationSections}
      user={{
        name: nurseData.name !== "Staff Nurse" ? nurseData.name : (currentUser?.name || "Staff Nurse"),
        role: `${nurseData.role} • ${nurseData.station}`,
        avatarUrl: currentUser?.avatar || "https://images.unsplash.com/photo-1594824813583-05e83ec86518?auto=format&fit=crop&w=150&q=80",
        profileHref: "/nurse/profile",
      }}
      headerTitle="Nursing Station"
      headerSubtitle={`${nurseData.department} • ${nurseData.station}`}
      headerStatus={{
        label: "Station Online",
        isOnline: true,
      }}
      headerActions={
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient..."
            className="w-44 lg:w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </form>
      }
      notifications={{
        count: unreadNotifications,
        href: "/nurse/notifications",
      }}
      onLogout={handleLogout}
      activeRoute={activeRoute}
    >
      {children}
    </AppShell>
  );
};

export * from "./NurseIcons";
