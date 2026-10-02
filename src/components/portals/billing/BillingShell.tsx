"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppShell, AppNavSection } from "@/components/layout/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import {
  DashboardIcon,
  InvoicesIcon,
  PaymentsIcon,
  OutstandingIcon,
  HistoryIcon,
  BellIcon,
  UserIcon,
  SettingsIcon,
  CurrencyDollarIcon,
} from "./BillingIcons";

interface BillingShellProps {
  children: React.ReactNode;
  activeRoute?: string;
  activeKey?: string;
}

export function BillingShell({ children, activeRoute }: BillingShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const { unreadCount: realtimeNotifs } = useNotifications();
  const [badgeCounts, setBadgeCounts] = useState<{
    pendingInvoices: number;
    outstanding: number;
    notifications: number;
  }>({
    pendingInvoices: 0,
    outstanding: 0,
    notifications: 0,
  });

  useEffect(() => {
    async function fetchBadgeCounts() {
      try {
        const [dashRes, notifRes] = await Promise.all([
          fetch("/api/billing/dashboard"),
          fetch("/api/billing/notifications"),
        ]);

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          let unread = 0;
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            unread = notifData.unreadCount || 0;
          }

          setBadgeCounts({
            pendingInvoices: dashData.stats?.pendingPaymentsCount || 0,
            outstanding: dashData.stats?.outstandingCount || 0,
            notifications: unread,
          });
        }
      } catch (err) {
        console.error("Failed to fetch billing badge counts:", err);
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
          href: "/billing/dashboard",
          icon: <DashboardIcon className="w-4 h-4" />,
          active: pathname === "/billing/dashboard" || pathname === "/billing",
        },
        {
          label: "Invoices",
          href: "/billing/invoices",
          icon: <InvoicesIcon className="w-4 h-4" />,
          badge: badgeCounts.pendingInvoices > 0 ? badgeCounts.pendingInvoices : null,
          badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
          active: pathname.startsWith("/billing/invoices"),
        },
        {
          label: "Payments",
          href: "/billing/payments",
          icon: <PaymentsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/billing/payments"),
        },
      ],
    },
    {
      title: "Accounts & Revenue",
      items: [
        {
          label: "Outstanding Balances",
          href: "/billing/outstanding",
          icon: <OutstandingIcon className="w-4 h-4" />,
          badge: badgeCounts.outstanding > 0 ? badgeCounts.outstanding : null,
          badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
          active: pathname.startsWith("/billing/outstanding"),
        },
        {
          label: "Billing History",
          href: "/billing/history",
          icon: <HistoryIcon className="w-4 h-4" />,
          active: pathname.startsWith("/billing/history"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          label: "Notifications",
          href: "/billing/notifications",
          icon: <BellIcon className="w-4 h-4" />,
          badge: badgeCounts.notifications > 0 ? badgeCounts.notifications : null,
          badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
          active: pathname.startsWith("/billing/notifications"),
        },
        {
          label: "Profile",
          href: "/billing/profile",
          icon: <UserIcon className="w-4 h-4" />,
          active: pathname.startsWith("/billing/profile"),
        },
        {
          label: "Settings",
          href: "/billing/settings",
          icon: <SettingsIcon className="w-4 h-4" />,
          active: pathname.startsWith("/billing/settings"),
        },
      ],
    },
  ];

  return (
    <AppShell
      brandName="CareSync"
      brandTagline="Billing & Accounts"
      brandBadge="BILLING"
      badgeColorClass="bg-blue-500/20 text-blue-300 border border-blue-500/30"
      brandIcon={
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
          <CurrencyDollarIcon className="w-4 h-4" />
        </div>
      }
      navigationSections={navigationSections}
      user={{
        name: currentUser?.name || "Billing Staff",
        role: "Billing Specialist • Counter 01",
        avatarUrl: currentUser?.avatar,
        profileHref: "/billing/profile",
      }}
      headerTitle="Billing & Revenue Console"
      headerSubtitle="Cashier Desk Online • Counter 01"
      headerStatus={{
        label: "Cashier Desk Ready",
        isOnline: true,
      }}
      headerActions={
        <Link
          href="/billing/invoices/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <span>+ Create Invoice</span>
        </Link>
      }
      notifications={{
        count: realtimeNotifs,
        href: "/billing/notifications",
      }}
      onLogout={handleLogout}
      activeRoute={activeRoute}
    >
      {children}
    </AppShell>
  );
}

export * from "./BillingIcons";
