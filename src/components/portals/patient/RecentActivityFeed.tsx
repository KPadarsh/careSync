import Link from "next/link";

export interface ActivityItem {
  id: string;
  title: string;
  timestamp: string;
  status: "success" | "info" | "neutral" | "warning";
}

const defaultActivities: ActivityItem[] = [
  {
    id: "act-1",
    title: "Lab report verified",
    timestamp: "Today, 09:45 AM",
    status: "success",
  },
  {
    id: "act-2",
    title: "Appointment booked",
    timestamp: "Yesterday, 14:20 PM",
    status: "info",
  },
  {
    id: "act-3",
    title: "Prescription updated",
    timestamp: "Aug 30, 2023",
    status: "neutral",
  },
];

const timelineNodeStyles: Record<string, { ring: string; dot: string }> = {
  success: {
    ring: "bg-[#22c55e]/20 border-[#22c55e]",
    dot: "bg-[#22c55e]",
  },
  info: {
    ring: "bg-[#3b82f6]/20 border-[#3b82f6]",
    dot: "bg-[#3b82f6]",
  },
  warning: {
    ring: "bg-[#f59e0b]/20 border-[#f59e0b]",
    dot: "bg-[#f59e0b]",
  },
  neutral: {
    ring: "bg-[#dce9ff] border-[#94a3b8]",
    dot: "bg-[#94a3b8]",
  },
};

export function RecentActivityFeed({
  activities = defaultActivities,
}: {
  activities?: ActivityItem[];
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-[0_4px_6px_-1px_rgba(15,23,42,0.05)]">
      <h3 className="text-base font-semibold text-[#0b1c30] mb-5">Recent Activity</h3>

      <div className="relative border-l border-[#e2e8f0] ml-3 space-y-6">
        {activities.map((item) => {
          const style = timelineNodeStyles[item.status] || timelineNodeStyles.neutral;
          return (
            <div key={item.id} className="relative pl-6">
              {/* Timeline Double-Ring Dot Indicator matching Stitch */}
              <span
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center ${style.ring}`}
                aria-hidden="true"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
              </span>
              <p className="text-sm font-medium text-[#0b1c30] leading-tight">
                {item.title}
              </p>
              <p className="text-xs text-[#45464d] mt-0.5">
                {item.timestamp}
              </p>
            </div>
          );
        })}
      </div>

      <Link
        href="/patient/medical-records"
        className="block w-full mt-6 py-2 text-center text-sm font-medium text-[#131b2e] hover:text-[#0b1c30] hover:underline transition-all cursor-pointer"
      >
        View All Activity
      </Link>
    </div>
  );
}
