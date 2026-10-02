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
  ConsultationIcon,
  LabIcon,
  PrescriptionsIcon,
  RecordsIcon,
  FollowUpsIcon,
  NotificationsIcon,
  ProfileIcon,
  SettingsIcon,
  SearchIcon,
  StethoscopeIcon,
} from "./DoctorIcons";

interface DoctorShellProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export const DoctorShell: React.FC<DoctorShellProps> = ({ children, activeRoute }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const [globalSearch, setGlobalSearch] = useState("");
  const [queueCount, setQueueCount] = useState<number>(0);
  const { unreadCount: unreadNotifs } = useNotifications();
  const [doctorInfo, setDoctorInfo] = useState({
    name: "Doctor",
    specialty: "Clinical Medicine",
    room: "Consultation Suite",
    avatar: "",
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const dashRes = await fetch("/api/doctor/dashboard");
        if (dashRes.ok) {
          const data = await dashRes.json();
          if (data.stats?.waitingCount !== undefined) {
            setQueueCount(data.stats.waitingCount);
          }
          if (data.doctor) {
            setDoctorInfo((prev) => ({
              ...prev,
              name: `${data.doctor.name}${data.doctor.qualification ? `, ${data.doctor.qualification}` : ""}`,
              specialty: data.doctor.specialty || "Cardiology",
              room: data.doctor.roomNumber || "Room 302",
              avatar: data.doctor.avatar || prev.avatar,
            }));
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
    router.push("/");
  };

  const navigationSections: AppNavSection[] = [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
          href: "/doctor/dashboard",
          icon: <DashboardIcon className="w-4 h-4" />,
          active: pathname === "/doctor/dashboard" || pathname === "/doctor",
        },
        {
          label: "Queue",
          href: "/doctor/queue",
          icon: <QueueIcon className="w-4 h-4" />,
          badge: queueCount > 0 ? queueCount : null,
          badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
          active: pathname.startsWith("/doctor/queue"),
        },
        {
          label: "Patients",
          href: "/doctor/patients",
          icon: <PatientsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/doctor/patients"),
        },
      ],
    },
    {
      title: "Clinical",
      items: [
        {
          label: "Consultations",
          href: "/doctor/queue",
          icon: <ConsultationIcon className="w-4 h-4" />,
          active: pathname.startsWith("/doctor/consultations"),
        },
        {
          label: "Lab Requests",
          href: "/doctor/lab",
          icon: <LabIcon className="w-4 h-4" />,
          active: pathname.startsWith("/doctor/lab"),
        },
        {
          label: "Prescriptions",
          href: "/doctor/prescriptions",
          icon: <PrescriptionsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/doctor/prescriptions"),
        },
        {
          label: "Medical Records",
          href: "/doctor/records",
          icon: <RecordsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/doctor/records"),
        },
        {
          label: "Follow-ups",
          href: "/doctor/follow-ups",
          icon: <FollowUpsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/doctor/follow-ups"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Notifications",
          href: "/doctor/notifications",
          icon: <NotificationsIcon className="w-4 h-4" />,
          badge: unreadNotifs > 0 ? unreadNotifs : null,
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
          active: pathname.startsWith("/doctor/notifications"),
        },
        {
          label: "Profile",
          href: "/doctor/profile",
          icon: <ProfileIcon className="w-4 h-4" />,
          active: pathname.startsWith("/doctor/profile"),
        },
        {
          label: "Settings",
          href: "/doctor/settings",
          icon: <SettingsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/doctor/settings"),
        },
      ],
    },
  ];

  return (
    <AppShell
      brandName="CareSync"
      brandTagline="Clinical Practice"
      brandBadge="DOCTOR"
      badgeColorClass="bg-sky-500/20 text-sky-300 border-sky-500/30"
      brandIcon={
        <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <StethoscopeIcon className="w-4 h-4" />
        </div>
      }
      navigationSections={navigationSections}
      user={{
        name: doctorInfo.name !== "Doctor" ? doctorInfo.name : (currentUser?.name || "Doctor"),
        role: `${doctorInfo.specialty} • ${doctorInfo.room}`,
        avatarUrl: doctorInfo.avatar || currentUser?.avatar,
        profileHref: "/doctor/profile",
      }}
      headerTitle="Clinical Portal"
      headerSubtitle={`Metro Health Clinic • ${doctorInfo.room}`}
      headerStatus={{
        label: "Consultation Ready",
        isOnline: true,
      }}
      headerActions={
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search patient MRN..."
            className="w-44 lg:w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </form>
      }
      notifications={{
        count: unreadNotifs,
        href: "/doctor/notifications",
      }}
      onLogout={handleLogout}
      activeRoute={activeRoute}
    >
      {children}
    </AppShell>
  );
};

export * from "./DoctorIcons";
