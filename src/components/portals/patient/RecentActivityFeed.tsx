import React from "react";
import { Card } from "@/components/ui/Card";

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

const statusDotStyles: Record<string, string> = {
  success: "bg-success border-success/30",
  info: "bg-info border-info/30",
  warning: "bg-warning border-warning/30",
  neutral: "bg-muted-foreground border-border",
};

export function RecentActivityFeed({
  activities = defaultActivities,
}: {
  activities?: ActivityItem[];
}) {
  return (
    <Card className="p-6 border border-border shadow-sm">
      <h3 className="text-h4 font-bold text-foreground mb-5">Recent Activity</h3>

      <div className="relative border-l border-border ml-2 space-y-6">
        {activities.map((item) => (
          <div key={item.id} className="relative pl-6">
            {/* Timeline Dot Indicator */}
            <span
              className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full border-2 ${statusDotStyles[item.status]}`}
              aria-hidden="true"
            />
            <p className="text-small font-semibold text-foreground leading-tight">
              {item.title}
            </p>
            <p className="text-caption text-muted-foreground mt-0.5">
              {item.timestamp}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="w-full mt-6 py-2 text-center text-caption font-semibold text-primary hover:underline transition-all cursor-pointer"
      >
        View All Activity
      </button>
    </Card>
  );
}
