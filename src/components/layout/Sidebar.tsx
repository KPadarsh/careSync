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
  navigationItems?: NavigationItem[];
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({
  brandName = "CareSync",
  brandSubtitle = "Healthcare System",
  navigationItems = [],
  isOpen = false,
  onClose,
  className = "",
}: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${className}`}
        aria-label="Sidebar Navigation"
      >
        {/* Brand / Logo Area */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link href="/" className="flex flex-col">
            <span className="text-h4 font-bold text-primary tracking-tight">
              {brandName}
            </span>
            {brandSubtitle && (
              <span className="text-caption text-muted-foreground">
                {brandSubtitle}
              </span>
            )}
          </Link>

          {/* Mobile Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground md:hidden cursor-pointer"
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
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-label transition-colors ${
                item.isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground/80 hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon && (
                  <span className="h-5 w-5 shrink-0 opacity-80" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-caption text-muted-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}

          {navigationItems.length === 0 && (
            <div className="p-4 text-center text-caption text-muted-foreground">
              No navigation items configured
            </div>
          )}
        </nav>

        {/* Footer Area / System Status */}
        <div className="border-t border-border p-4 text-caption text-muted-foreground">
          CareSync Platform v0.1.0
        </div>
      </aside>
    </>
  );
}
