import React from "react";
import { Card } from "@/components/ui/Card";

export interface HealthProfileProps {
  bloodGroup?: string;
  age?: string | number;
  lastVisit?: string;
  primaryDoctor?: string;
}

export function HealthProfileCard({
  bloodGroup = "O+",
  age = "32 Years",
  lastVisit = "Aug 15, 2023",
  primaryDoctor = "Dr. Anjali Menon",
}: HealthProfileProps) {
  return (
    <Card className="p-6 border border-border shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h3 className="text-h4 font-bold text-foreground">Health Profile</h3>
      </div>

      <div className="space-y-3.5">
        {/* Blood Group */}
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <span className="text-small text-muted-foreground flex items-center gap-2">
            <svg className="h-4 w-4 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            Blood Group
          </span>
          <span className="text-label font-bold text-error bg-error/10 px-2 py-0.5 rounded">
            {bloodGroup}
          </span>
        </div>

        {/* Age */}
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <span className="text-small text-muted-foreground flex items-center gap-2">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Age
          </span>
          <span className="text-small font-semibold text-foreground">{age}</span>
        </div>

        {/* Last Visit */}
        <div className="flex items-center justify-between py-2 border-b border-border/60">
          <span className="text-small text-muted-foreground flex items-center gap-2">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Last Visit
          </span>
          <span className="text-small font-semibold text-foreground">{lastVisit}</span>
        </div>

        {/* Primary Doctor */}
        <div className="flex flex-col pt-1">
          <span className="text-caption text-muted-foreground mb-1.5 flex items-center gap-2">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Primary Doctor
          </span>
          <div className="flex items-center gap-2.5 p-2 rounded-md bg-surface-muted">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-caption font-bold text-primary">
              AM
            </div>
            <span className="text-small font-semibold text-foreground">{primaryDoctor}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
