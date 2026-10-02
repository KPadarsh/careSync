"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AppNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number | null;
  badgeColor?: string;
  active?: boolean;
}

export interface AppNavSection {
  title?: string;
  items: AppNavItem[];
}

export interface AppUser {
  name: string;
  role: string;
  avatarUrl?: string;
  initials?: string;
  profileHref?: string;
}

export interface AppShellProps {
  brandName?: string;
  brandTagline?: string;
  brandBadge?: string;
  badgeColorClass?: string;
  brandIcon?: React.ReactNode;
  navigationSections: AppNavSection[];
  user: AppUser;
  headerTitle?: string;
  headerSubtitle?: string;
  headerStatus?: {
    label: string;
    isOnline?: boolean;
  };
  headerActions?: React.ReactNode;
  notifications?: {
    count: number;
    href: string;
  };
  onLogout?: () => void;
  children: React.ReactNode;
  activeRoute?: string;
}

export function AppShell({
  brandName = "CareSync",
  brandTagline = "Clinic Management",
  brandBadge,
  badgeColorClass = "bg-blue-500/20 text-blue-300 border-blue-500/30",
  brandIcon,
  navigationSections,
  user,
  headerTitle,
  headerSubtitle,
  headerStatus,
  headerActions,
  notifications,
  onLogout,
  children,
  activeRoute,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isItemActive = (item: AppNavItem) => {
    if (item.active !== undefined) return item.active;
    if (activeRoute) return activeRoute === item.href;
    if (item.href === "/" || item.href.endsWith("/dashboard")) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };

  const defaultBrandIcon = (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-xs shrink-0">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
      </svg>
    </div>
  );

  return (
    <div className="h-dvh flex overflow-hidden w-full bg-[#f8fafc] text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* ======================================================== */}
      {/* DESKTOP STATIONARY SIDEBAR (w-64, 100% height, flex-col)  */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0f172a] border-r border-slate-800/80 shrink-0 h-full select-none z-30">
        {/* Brand / Logo Area */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/70 shrink-0">
          <div className="flex items-center gap-2.5">
            {brandIcon || defaultBrandIcon}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[15px] tracking-tight text-white leading-none">
                  {brandName}
                </span>
                {brandBadge && (
                  <span
                    className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded border leading-none ${badgeColorClass}`}
                  >
                    {brandBadge}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-1 leading-none">
                {brandTagline}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sections with Independent Scroll if needed */}
        <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto custom-scrollbar">
          {navigationSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const active = isItemActive(item);
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      active
                        ? "bg-blue-600 text-white font-semibold shadow-xs"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`transition-colors shrink-0 ${
                          active ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && item.badge !== null && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ml-1.5 ${
                          active
                            ? "bg-white/20 text-white"
                            : item.badgeColor || "bg-slate-800 text-slate-200 border border-slate-700/60"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Profile & Logout Bottom Area */}
        <div className="p-3 border-t border-slate-800/80 bg-[#0c1322] shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <Link
              href={user.profileHref || "#"}
              className="flex items-center gap-2.5 overflow-hidden group flex-1 mr-2"
            >
              <div className="relative w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 font-semibold text-xs shrink-0 overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.initials || user.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 truncate transition-colors leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium truncate mt-0.5 leading-tight">
                  {user.role}
                </span>
              </div>
            </Link>

            {onLogout && (
              <button
                onClick={onLogout}
                type="button"
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE DRAWER OVERLAY (< lg)                             */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-[#0f172a] border-r border-slate-800 flex flex-col h-full z-10 shadow-2xl">
            {/* Header */}
            <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2.5">
                {brandIcon || defaultBrandIcon}
                <span className="font-bold text-base text-white">{brandName}</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
              {navigationSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  {section.title && (
                    <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const active = isItemActive(item);
                    return (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                          active
                            ? "bg-blue-600 text-white font-semibold"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={active ? "text-white" : "text-slate-400"}>
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.badgeColor || "bg-slate-800 text-slate-200"}`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Mobile Footer */}
            <div className="p-3 border-t border-slate-800 bg-[#0c1322] shrink-0">
              {onLogout && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2.5 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RIGHT SIDE: Stationed Header + Independent Scroll Main   */}
      {/* ======================================================== */}
      <div className="min-w-0 flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 shrink-0 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between z-10 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Header Titles & Status */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {headerTitle || "CareSync Portal"}
                </span>
                {headerStatus && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline" />
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {headerStatus.label}
                    </span>
                  </>
                )}
              </div>
              {headerSubtitle && (
                <span className="text-[11px] text-slate-400 mt-0.5 hidden sm:inline">
                  {headerSubtitle}
                </span>
              )}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {headerActions}

            {notifications && (
              <Link
                href={notifications.href}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Notifications"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.count > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
                    {notifications.count > 99 ? "99+" : notifications.count}
                  </span>
                )}
              </Link>
            )}

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <Link
              href={user.profileHref || "#"}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.initials || user.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  {user.role}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Primary Scrollable Content Container */}
        <main className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
