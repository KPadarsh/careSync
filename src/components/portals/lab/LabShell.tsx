"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import { AppShell, AppNavSection } from "@/components/layout/AppShell";
import {
  DashboardIcon,
  RequestsIcon,
  SamplesIcon,
  TestsIcon,
  CompletedIcon,
  NotificationsIcon,
  ProfileIcon,
  SettingsIcon,
  SearchIcon,
  BarcodeIcon,
} from "./LabIcons";

interface LabShellProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export const LabShell: React.FC<LabShellProps> = ({ children, activeRoute }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const { unreadCount: unreadNotifications } = useNotifications();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [samplesPendingCount, setSamplesPendingCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [technicianData, setTechnicianData] = useState<{
    name: string;
    role: string;
    station: string;
  }>({
    name: "Lab Technician",
    role: "Medical Lab Technologist (MLT)",
    station: "Station 2 • Central Diagnostic Lab",
  });

  useEffect(() => {
    async function loadLabHeader() {
      try {
        const [dashRes, profileRes] = await Promise.all([
          fetch("/api/lab/dashboard"),
          fetch("/api/lab/profile"),
        ]);

        if (dashRes.ok) {
          const d = await dashRes.json();
          if (d.metrics) {
            setPendingRequestsCount(d.metrics.newRequests || 0);
            setSamplesPendingCount(d.metrics.samplesPending || 0);
          }
        }
        if (profileRes.ok) {
          const p = await profileRes.json();
          if (p.user) {
            setTechnicianData({
              name: p.user.name || "Lab Technician",
              role: p.user.role || "Medical Lab Technologist (MLT)",
              station: p.user.station || "Station 2 • Central Diagnostic Lab",
            });
          }
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
    router.push("/");
  };

  const navigationSections: AppNavSection[] = [
    {
      title: "Main",
      items: [
        {
          label: "Dashboard",
          href: "/lab/dashboard",
          icon: <DashboardIcon className="w-4 h-4" />,
          active: pathname === "/lab/dashboard" || pathname === "/lab",
        },
        {
          label: "Test Requests",
          href: "/lab/requests",
          icon: <RequestsIcon className="w-4 h-4" />,
          badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
          badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
          active: pathname.startsWith("/lab/requests"),
        },
        {
          label: "Sample Collection",
          href: "/lab/samples",
          icon: <SamplesIcon className="w-4 h-4" />,
          badge: samplesPendingCount > 0 ? samplesPendingCount : null,
          badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
          active: pathname.startsWith("/lab/samples"),
        },
      ],
    },
    {
      title: "Diagnostics & Worklist",
      items: [
        {
          label: "Testing Bench",
          href: "/lab/tests",
          icon: <TestsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/lab/tests"),
        },
        {
          label: "Completed Tests",
          href: "/lab/completed",
          icon: <CompletedIcon className="w-4 h-4" />,
          active: pathname.startsWith("/lab/completed"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Notifications",
          href: "/lab/notifications",
          icon: <NotificationsIcon className="w-4 h-4" />,
          badge: unreadNotifications > 0 ? unreadNotifications : null,
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
          active: pathname.startsWith("/lab/notifications"),
        },
        {
          label: "Profile",
          href: "/lab/profile",
          icon: <ProfileIcon className="w-4 h-4" />,
          active: pathname.startsWith("/lab/profile"),
        },
        {
          label: "Settings",
          href: "/lab/settings",
          icon: <SettingsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/lab/settings"),
        },
      ],
    },
  ];

  return (
    <AppShell
      brandName="CareSync"
      brandTagline="Diagnostic Pathology Lab"
      brandBadge="LAB"
      badgeColorClass="bg-purple-500/20 text-purple-300 border border-purple-500/30"
      brandIcon={
        <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <BarcodeIcon className="w-4 h-4" />
        </div>
      }
      navigationSections={navigationSections}
      user={{
        name: technicianData.name !== "Lab Technician" ? technicianData.name : (currentUser?.name || "Lab Technician"),
        role: `${technicianData.role} • ${technicianData.station}`,
        avatarUrl: currentUser?.avatar || "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=150&q=80",
        profileHref: "/lab/profile",
      }}
      headerTitle="Diagnostic Laboratory"
      headerSubtitle={technicianData.station}
      headerStatus={{
        label: "Lab Bench Online",
        isOnline: true,
      }}
      headerActions={
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search specimen or test..."
            className="w-44 lg:w-56 pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
          />
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </form>
      }
      notifications={{
        count: unreadNotifications,
        href: "/lab/notifications",
      }}
      onLogout={handleLogout}
      activeRoute={activeRoute}
    >
      {children}
    </AppShell>
  );
};

export * from "./LabIcons";
