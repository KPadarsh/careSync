import React from "react";

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  searchSlot?: React.ReactNode;
  actionsSlot?: React.ReactNode;
  userSlot?: React.ReactNode;
  className?: string;
}

export function Header({
  title = "CareSync",
  subtitle,
  onMenuToggle,
  searchSlot,
  actionsSlot,
  userSlot,
  className = "",
}: HeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-xs sm:px-6 ${className}`}
    >
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground md:hidden cursor-pointer"
            aria-label="Open sidebar menu"
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="flex flex-col">
          <h1 className="text-h4 font-semibold text-foreground tracking-tight">{title}</h1>
          {subtitle && <p className="text-caption text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {/* Middle: Search Area Slot */}
      {searchSlot && <div className="hidden md:flex max-w-xs flex-1 px-4">{searchSlot}</div>}

      {/* Right: Actions (Notifications) & User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {actionsSlot}

        {/* Structural Notification Placeholder */}
        {!actionsSlot && (
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="View notifications"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
        )}

        {/* User Slot or Structural Placeholder */}
        {userSlot ? (
          userSlot
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-caption font-semibold text-primary"
              aria-label="User profile avatar"
            >
              CS
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
