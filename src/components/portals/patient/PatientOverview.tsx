import Link from "next/link";
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
          <h2 className="text-2xl sm:text-[32px] sm:leading-[40px] font-bold text-[#0b1c30] tracking-tight">
            Good morning, {patientName}
          </h2>
          <p className="text-sm text-[#45464d] mt-1">
            Here is an overview of your health and upcoming tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/patient/appointments">
            <button
              type="button"
              className="px-4 py-2 bg-[#131b2e] text-white rounded-lg shadow-sm text-sm font-medium hover:bg-[#213145] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>Book Appointment</span>
            </button>
          </Link>

          <Link href="/patient/lab-reports">
            <button
              type="button"
              className="px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg shadow-sm text-sm font-medium text-[#0b1c30] hover:bg-[#eff4ff] transition-colors flex items-center gap-2 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Report</span>
            </button>
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
