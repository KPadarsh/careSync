import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export interface UpcomingAppointmentProps {
  doctorName?: string;
  specialty?: string;
  date?: string;
  time?: string;
  status?: string;
  location?: string;
  avatarUrl?: string;
}

export function UpcomingAppointmentCard({
  doctorName = "Dr. Anjali Menon",
  specialty = "General Medicine",
  date = "Tomorrow",
  time = "10:30 AM",
  status = "Confirmed",
  location = "Consultation Room 302, Main Clinic",
  avatarUrl,
}: UpcomingAppointmentProps) {
  return (
    <Card className="overflow-hidden border border-border shadow-sm">
      {/* Card Header Banner */}
      <div className="flex items-center justify-between border-b border-border bg-surface-muted/60 px-6 py-3.5">
        <h3 className="text-label font-semibold text-foreground">Next Appointment</h3>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-success/10 text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          {status}
        </span>
      </div>

      {/* Main Appointment Body */}
      <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex gap-4 items-center">
          {/* Doctor Avatar or Initial Placeholder */}
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 shrink-0 flex items-center justify-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={doctorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-h4 font-bold text-primary">AM</span>
            )}
          </div>

          <div>
            <h4 className="text-h4 font-bold text-foreground">{doctorName}</h4>
            <p className="text-small text-muted-foreground mb-1.5">{specialty}</p>

            <div className="flex flex-wrap items-center gap-3 text-caption text-foreground/80 font-medium">
              <span className="flex items-center gap-1 text-primary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {date}
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1 text-foreground/80">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {time}
              </span>
              {location && (
                <>
                  <span className="text-border">•</span>
                  <span className="text-muted-foreground hidden sm:inline">{location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" className="flex-1 md:flex-none">
            Reschedule
          </Button>
          <Button variant="primary" size="sm" className="flex-1 md:flex-none">
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
