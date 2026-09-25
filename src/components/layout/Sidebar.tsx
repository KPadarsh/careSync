"use client";

import React from "react";
import Link from "next/link";

export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  isActive?: boolean;
}

export interface SidebarProps {
  brandName?: string;
  brandSubtitle?: string;
  logoIcon?: React.ReactNode;
  navigationItems?: NavigationItem[];
  footerSlot?: React.ReactNode;
  showEmergencySupport?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({
  brandName = "CareSync",
  brandSubtitle = "Patient Portal",
  logoIcon,
  navigationItems = [],
  footerSlot,
  showEmergencySupport = true,
  isOpen = false,
  onClose,
  className = "",
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container - Exact Stitch 280px Dark Navy Shell */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#1e293b] bg-[#131b2e] text-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${className}`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand / Logo Area */}
        <div className="flex h-20 items-center justify-between px-6 pt-2">
          <Link href="/patient" className="flex items-center gap-3">
            {logoIcon ? (
              logoIcon
            ) : (
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#006a61] to-[#89f5e7] flex items-center justify-center p-1.5 shadow-sm">
                <svg className="w-full h-full text-[#131b2e]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
                {brandName}
              </h1>
              <p className="text-xs font-medium text-[#89f5e7] leading-none mt-0.5">
                {brandSubtitle}
              </p>
            </div>
          </Link>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-[#7c839b] hover:bg-white/10 hover:text-white md:hidden cursor-pointer"
              aria-label="Close sidebar"
            >
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded px-4 py-2.5 text-[13px] transition-all duration-150 ${
                item.isActive
                  ? "bg-white/10 text-[#89f5e7] font-bold border-l-4 border-[#89f5e7]"
                  : "text-[#7c839b] hover:text-white hover:bg-white/5 font-medium"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <span className={`h-5 w-5 shrink-0 ${item.isActive ? "text-[#89f5e7]" : "text-[#7c839b]"}`} aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-[#1e293b] px-2 py-0.5 text-xs text-[#89f5e7] font-semibold">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer Area - Exact Stitch Emergency Support, Help Center & Logout */}
        <div className="mt-auto p-4 border-t border-[#1e293b] space-y-2">
          {footerSlot ? (
            footerSlot
          ) : (
            <>
              {showEmergencySupport && (
                <button
                  type="button"
                  className="w-full mb-3 flex items-center justify-center gap-2 bg-[#ba1a1a]/20 text-[#ffdad6] border border-[#ba1a1a]/30 hover:bg-[#ba1a1a]/30 py-2.5 px-3 rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  <svg className="h-4 w-4 text-[#ffdad6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Emergency Support
                </button>
              )}

              <Link
                href="/patient/settings"
                className="flex items-center gap-3 px-4 py-2 rounded text-[#7c839b] hover:text-white hover:bg-white/5 text-[13px] font-medium transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Help Center
              </Link>

              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-2 rounded text-[#7c839b] hover:text-white hover:bg-white/5 text-[13px] font-medium transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Link>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
