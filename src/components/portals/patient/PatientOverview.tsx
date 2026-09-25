import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { PatientStats } from "./PatientStats";
import { UpcomingAppointmentCard } from "./UpcomingAppointmentCard";
import { QuickActions } from "./QuickActions";
import { HealthProfileCard } from "./HealthProfileCard";
import { RecentActivityFeed } from "./RecentActivityFeed";

export interface PatientOverviewProps {
  patientName?: string;
}

export function PatientOverview({ patientName = "Rahul" }: PatientOverviewProps) {
  return (
    <div className="space-y-8">
      {/* Page Header with Greeting & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-h2 font-bold text-foreground tracking-tight">
            Good morning, {patientName}
          </h2>
          <p className="text-body text-muted-foreground mt-1">
            Here is an overview of your health and upcoming tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/patient/appointments">
            <Button variant="primary" size="md" className="gap-2 cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Book Appointment
            </Button>
          </Link>

          <Link href="/patient/lab-reports">
            <Button variant="outline" size="md" className="gap-2 cursor-pointer">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Main 12-Column Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Stats, Spotlight & Quick Actions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stat Cards */}
          <PatientStats />

          {/* Next Appointment Spotlight */}
          <UpcomingAppointmentCard />

          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Right Column (4 cols): Health Profile & Timeline */}
        <div className="lg:col-span-4 space-y-6">
          {/* Health Profile Widget */}
          <HealthProfileCard />

          {/* Recent Activity Feed */}
          <RecentActivityFeed />
        </div>
      </div>
    </div>
  );
}
