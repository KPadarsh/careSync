import Link from "next/link";

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
  avatarUrl = "https://lh3.googleusercontent.com/aida-public/AB6AXuCUxUcfzaYOvK9K8s2-jCEYcCiZbqTYVelTwDmfFa3f1itzv7NxhEv1pjNI5AAAM8Wo8KFVRmMK9uYKFbfVQieZKmlkh2UQ7Rrq2PIBHsx9nbF8xjm9-18_QrHoFN6SnfWAOEPp1Q-ETmupLekP79pMmugtCZdwzF0bQxXgT6Bt4YS-d0SF3n4aC0REf5mllD-eLVLWKiEN8WPisgCA-p8cVWYoLwnV0mzwl0-Gd8FXhPJp2Veap7zk7w",
}: UpcomingAppointmentProps) {
  return (
    <section className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)] overflow-hidden">
      {/* Card Header Banner */}
      <div className="border-b border-[#e2e8f0] bg-[#eff4ff] px-6 py-4 flex justify-between items-center">
        <h3 className="text-base font-semibold text-[#0b1c30]">Next Appointment</h3>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#22c55e]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          {status}
        </span>
      </div>

      {/* Main Appointment Body */}
      <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex gap-5 items-center">
          {/* Doctor Avatar */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#dce9ff] shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt={doctorName} className="w-full h-full object-cover" />
          </div>

          <div>
            <h4 className="text-lg font-bold text-[#0b1c30]">{doctorName}</h4>
            <p className="text-sm text-[#45464d] mb-2">{specialty}</p>

            <div className="flex items-center gap-4 text-sm text-[#45464d]">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {date}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {time}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link href="/patient/appointments" className="flex-1 md:flex-none">
            <button
              type="button"
              className="w-full px-4 py-2 border border-[#e2e8f0] text-[#0b1c30] bg-white rounded-lg text-sm font-medium hover:bg-[#eff4ff] transition-colors cursor-pointer"
            >
              Reschedule
            </button>
          </Link>
          <Link href="/patient/appointments" className="flex-1 md:flex-none">
            <button
              type="button"
              className="w-full px-4 py-2 bg-[#131b2e] text-white rounded-lg text-sm font-medium hover:bg-[#213145] transition-colors shadow-sm cursor-pointer"
            >
              View Details
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
