"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DashboardIcon,
  InvoicesIcon,
  PaymentsIcon,
  OutstandingIcon,
  HistoryIcon,
  BellIcon,
  UserIcon,
  SettingsIcon,
  LogoutIcon,
  CurrencyDollarIcon,
  AlertTriangleIcon,
} from "./BillingIcons";

interface BillingShellProps {
  children: React.ReactNode;
  activeRoute?: string;
  activeKey?: string;
}

export function BillingShell({ children, activeRoute, activeKey }: BillingShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const navItems = [
    {
      label: "Dashboard",
      href: "/billing/dashboard",
      icon: <DashboardIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      label: "Invoices",
      href: "/billing/invoices",
      icon: <InvoicesIcon className="w-5 h-5 shrink-0" />,
      badge: badgeCounts.pendingInvoices > 0 ? badgeCounts.pendingInvoices : null,
      badgeColor: "bg-blue-500 text-white",
    },
    {
      label: "Payments",
      href: "/billing/payments",
      icon: <PaymentsIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      label: "Outstanding",
      href: "/billing/outstanding",
      icon: <OutstandingIcon className="w-5 h-5 shrink-0" />,
      badge: badgeCounts.outstanding > 0 ? badgeCounts.outstanding : null,
      badgeColor: "bg-amber-500 text-white",
    },
    {
      label: "Billing History",
      href: "/billing/history",
      icon: <HistoryIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      label: "Notifications",
      href: "/billing/notifications",
      icon: <BellIcon className="w-5 h-5 shrink-0" />,
      badge: badgeCounts.notifications > 0 ? badgeCounts.notifications : null,
      badgeColor: "bg-red-500 text-white",
    },
    {
      label: "Profile",
      href: "/billing/profile",
      icon: <UserIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
    {
      label: "Settings",
      href: "/billing/settings",
      icon: <SettingsIcon className="w-5 h-5 shrink-0" />,
      badge: null,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    router.push("/");
  };

  const isActive = (href: string) => {
    if (activeRoute) return activeRoute === href;
    if (href === "/billing/dashboard") {
      return pathname === "/billing/dashboard" || pathname === "/billing";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-[#060D1A] text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* SIDEBAR - Stitch Deep Navy */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0A1324] border-r border-slate-800/80 sticky top-0 h-screen select-none z-30">
        {/* Brand / Logo */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/60">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-950/40 text-white">
            <CurrencyDollarIcon className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">CareSync</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                BILLING
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium -mt-0.5">Financial Services</span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Revenue & Billing
          </div>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950/40 font-semibold"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`transition-colors ${
                      active ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold shadow-sm ${
                      item.badgeColor || "bg-slate-700 text-slate-200"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Staff Profile / Logout Footer */}
        <div className="p-3 border-t border-slate-800/60 bg-[#08101E]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <Link href="/billing/profile" className="flex items-center gap-2.5 overflow-hidden group">
              <div className="relative w-8 h-8 rounded-full bg-blue-800/50 border border-blue-500/40 flex items-center justify-center text-blue-300 font-semibold text-xs shrink-0 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
                  alt="Meera Nair"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 truncate transition-colors">
                  Meera Nair
                </span>
                <span className="text-[10px] text-blue-400 font-medium truncate">
                  Billing Specialist
                </span>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogoutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 px-4 lg:px-8 border-b border-slate-800/80 bg-[#0A1324]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-300 hidden sm:inline">
                Cashier Desk Online • Counter 01
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/billing/invoices/new"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-950/30 transition-all hover:scale-102"
            >
              <span>+ Create Invoice</span>
            </Link>

            <Link
              href="/billing/notifications"
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            >
              <BellIcon className="w-5 h-5" />
              {badgeCounts.notifications > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0A1324]" />
              )}
            </Link>

            <div className="h-6 w-px bg-slate-800 mx-1" />

            <Link href="/billing/profile" className="flex items-center gap-2 pl-1 group">
              <div className="w-8 h-8 rounded-full ring-2 ring-blue-500/40 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80"
                  alt="Meera Nair"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300 leading-tight">
                  Meera Nair
                </span>
                <span className="text-[10px] text-blue-400 leading-tight">Patient Accounts</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0A1324] border-b border-slate-800 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm ${
                  isActive(item.href)
                    ? "bg-blue-600 text-white font-medium"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.badgeColor || "bg-slate-700"}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg mt-2"
            >
              <LogoutIcon className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export * from "./BillingIcons";
