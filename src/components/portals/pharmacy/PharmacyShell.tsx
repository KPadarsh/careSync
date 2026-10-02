"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, AppNavSection } from "@/components/layout/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DashboardIcon,
  PrescriptionsIcon,
  DispensingIcon,
  MedicinesIcon,
  HistoryIcon,
  BellIcon,
  UserIcon,
  SettingsIcon,
  PharmacyPillIcon,
  AlertTriangleIcon,
} from "./PharmacyIcons";

interface PharmacyShellProps {
  children: React.ReactNode;
  activeRoute?: string;
}

export function PharmacyShell({ children, activeRoute }: PharmacyShellProps) {
  const { user: currentUser } = useCurrentUser();
  const { unreadCount: realtimeNotifs } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();
  const [badgeCounts, setBadgeCounts] = useState<{
    pendingRx: number;
    inProgressDispense: number;
    lowStock: number;
    notifications: number;
  }>({
    pendingRx: 0,
    inProgressDispense: 0,
    lowStock: 0,
    notifications: 0,
  });

  useEffect(() => {
    async function fetchBadgeCounts() {
      try {
        const [dashRes, notifRes] = await Promise.all([
          fetch("/api/pharmacy/dashboard"),
          fetch("/api/pharmacy/notifications"),
        ]);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          let unread = 0;
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            unread = notifData.unreadCount || 0;
          }

          setBadgeCounts({
            pendingRx: dashData.stats?.pendingPrescriptionsCount || 0,
            inProgressDispense: dashData.stats?.inProgressDispensingCount || 0,
            lowStock: dashData.stats?.lowStockMedicinesCount || 0,
            notifications: unread,
          });
        }
      } catch (err) {
        console.error("Failed to fetch pharmacy badge counts:", err);
      }
    }
    fetchBadgeCounts();
  }, [pathname]);

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
          href: "/pharmacy/dashboard",
          icon: <DashboardIcon className="w-4 h-4" />,
          active: pathname === "/pharmacy/dashboard" || pathname === "/pharmacy",
        },
        {
          label: "Prescriptions",
          href: "/pharmacy/prescriptions",
          icon: <PrescriptionsIcon className="w-4 h-4" />,
          badge: badgeCounts.pendingRx > 0 ? badgeCounts.pendingRx : null,
          badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
          active: pathname.startsWith("/pharmacy/prescriptions"),
        },
        {
          label: "Dispensing",
          href: "/pharmacy/dispensing",
          icon: <DispensingIcon className="w-4 h-4" />,
          badge: badgeCounts.inProgressDispense > 0 ? badgeCounts.inProgressDispense : null,
          badgeColor: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
          active: pathname.startsWith("/pharmacy/dispensing"),
        },
      ],
    },
    {
      title: "Inventory & History",
      items: [
        {
          label: "Medicines & Stock",
          href: "/pharmacy/medicines",
          icon: <MedicinesIcon className="w-4 h-4" />,
          badge: badgeCounts.lowStock > 0 ? badgeCounts.lowStock : null,
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
          active: pathname.startsWith("/pharmacy/medicines"),
        },
        {
          label: "Dispensing History",
          href: "/pharmacy/history",
          icon: <HistoryIcon className="w-4 h-4" />,
          active: pathname.startsWith("/pharmacy/history"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Notifications",
          href: "/pharmacy/notifications",
          icon: <BellIcon className="w-4 h-4" />,
          badge: badgeCounts.notifications > 0 ? badgeCounts.notifications : null,
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
          active: pathname.startsWith("/pharmacy/notifications"),
        },
        {
          label: "Profile",
          href: "/pharmacy/profile",
          icon: <UserIcon className="w-4 h-4" />,
          active: pathname.startsWith("/pharmacy/profile"),
        },
        {
          label: "Settings",
          href: "/pharmacy/settings",
          icon: <SettingsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/pharmacy/settings"),
        },
      ],
    },
  ];

  return (
    <AppShell
      brandName="CareSync"
      brandTagline="Central Dispensary"
      brandBadge="PHARMACY"
      badgeColorClass="bg-teal-500/20 text-teal-300 border border-teal-500/30"
      brandIcon={
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <PharmacyPillIcon className="w-4 h-4" />
        </div>
      }
      navigationSections={navigationSections}
      user={{
        name: currentUser?.name || "Pharmacist",
        role: "Central Pharmacy",
        avatarUrl: currentUser?.avatar,
        profileHref: "/pharmacy/profile",
      }}
      headerTitle="Central Pharmacy & Dispensary"
      headerSubtitle="Dispensary Station B-2"
      headerStatus={{
        label: "Dispensary Online",
        isOnline: true,
      }}
      headerActions={
        badgeCounts.lowStock > 0 ? (
          <Link
            href="/pharmacy/medicines"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
          >
            <AlertTriangleIcon className="w-3.5 h-3.5" />
            <span>{badgeCounts.lowStock} Low Stock Alert{badgeCounts.lowStock > 1 ? "s" : ""}</span>
          </Link>
        ) : null
      }
      notifications={{
        count: realtimeNotifs,
        href: "/pharmacy/notifications",
      }}
      onLogout={handleLogout}
      activeRoute={activeRoute}
    >
      {children}
    </AppShell>
  );
}

export * from "./PharmacyIcons";
