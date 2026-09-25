"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export interface AppointmentItem {
  id: string;
  doctorName: string;
  specialty: string;
  department: string;
  date: string;
  time: string;
  status: "Confirmed" | "Waiting Room" | "Scheduled" | "Completed" | "Cancelled";
  avatarInitials: string;
}

const mockAppointments: AppointmentItem[] = [
  {
    id: "#A-8492",
    doctorName: "Dr. Sarah Jenkins",
    specialty: "Cardiology",
    department: "Heart Center, Rm 402",
    date: "Oct 24, 2026",
    time: "10:00 AM - 10:45 AM",
    status: "Confirmed",
    avatarInitials: "SJ",
  },
  {
    id: "#A-8501",
    doctorName: "Dr. Michael Chen",
    specialty: "Primary Care",
    department: "Main Clinic, Rm 102",
    date: "Today",
    time: "2:30 PM - 3:00 PM",
    status: "Waiting Room",
    avatarInitials: "MC",
  },
  {
    id: "#A-8612",
    doctorName: "Dr. Emily Rivera",
    specialty: "Dermatology",
    department: "Skin & Laser Center",
    date: "Nov 12, 2026",
    time: "9:15 AM - 9:45 AM",
    status: "Scheduled",
    avatarInitials: "ER",
  },
  {
    id: "#A-8120",
    doctorName: "Dr. Anjali Menon",
    specialty: "General Medicine",
    department: "OPD Wing B",
    date: "Sep 15, 2026",
    time: "11:00 AM - 11:30 AM",
    status: "Completed",
    avatarInitials: "AM",
  },
];

export function AppointmentsView() {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filtered = mockAppointments.filter((item) => {
    if (activeTab === "upcoming") {
      if (item.status === "Completed" || item.status === "Cancelled") return false;
    } else if (activeTab === "past") {
      if (item.status !== "Completed") return false;
    } else if (activeTab === "cancelled") {
      if (item.status !== "Cancelled") return false;
    }

    if (selectedStatus !== "all" && item.status.toLowerCase().replace(" ", "_") !== selectedStatus) {
      return false;
    }

    if (
      searchQuery &&
      !item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.id.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Book Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-h2 font-bold text-foreground tracking-tight">Appointments</h2>
          <p className="text-body text-muted-foreground mt-1">
            Manage your upcoming visits and review past consultations.
          </p>
        </div>

        <Button variant="primary" size="md" className="gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Book New Appointment
        </Button>
      </div>

      {/* Main Table Card Container */}
      <Card className="overflow-hidden border border-border shadow-sm">
        {/* Navigation Tabs */}
        <div className="border-b border-border px-4 flex items-center gap-2 bg-surface-muted/30">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-3 text-label font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "upcoming"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Upcoming (3)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`px-4 py-3 text-label font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "past"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Past (1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`px-4 py-3 text-label font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "cancelled"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Cancelled (0)
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-surface border-b border-border flex flex-wrap gap-3 items-center">
          <div className="relative min-w-[220px] flex-1 sm:flex-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Doctor, ID, specialty..."
              className="w-full bg-surface-muted/50 border border-border rounded-md pl-9 pr-3 py-2 text-small text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="min-w-[160px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-surface-muted/50 border border-border rounded-md px-3 py-2 text-small text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="waiting_room">Waiting Room</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-muted/40 text-muted-foreground text-caption font-bold uppercase tracking-wider border-b border-border">
                <th className="py-3 px-4 w-24">ID</th>
                <th className="py-3 px-4">Doctor / Provider</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 w-48">Date &amp; Time</th>
                <th className="py-3 px-4 w-36">Status</th>
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-surface-muted/30 transition-colors">
                  <td className="py-3.5 px-4 text-caption font-mono font-medium text-muted-foreground">
                    {item.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-caption font-bold text-primary shrink-0">
                        {item.avatarInitials}
                      </div>
                      <div>
                        <div className="text-small font-semibold text-foreground">{item.doctorName}</div>
                        <div className="text-caption text-muted-foreground">{item.specialty}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-small text-muted-foreground">
                    {item.department}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-small font-medium text-foreground">{item.date}</div>
                    <div className="text-caption text-muted-foreground">{item.time}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.status === "Confirmed" && (
                      <Badge variant="success">Confirmed</Badge>
                    )}
                    {item.status === "Waiting Room" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-caption font-semibold bg-info/10 text-info border border-info/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" />
                        Waiting Room
                      </span>
                    )}
                    {item.status === "Scheduled" && (
                      <Badge variant="info">Scheduled</Badge>
                    )}
                    {item.status === "Completed" && (
                      <Badge variant="neutral">Completed</Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10">
                      Details
                    </Button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-small text-muted-foreground">
                    No appointments found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
