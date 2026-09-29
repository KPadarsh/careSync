"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  SchedulesIcon,
  SearchIcon,
  PlusIcon,
  RefreshIcon,
  ChevronRightIcon,
  ClockIcon,
  BuildingIcon,
  DoctorsIcon,
  StaffIcon,
} from "./AdminShell";

interface ScheduleItem {
  _id: string;
  personName: string;
  personType: "staff" | "doctor";
  role: string;
  department: string;
  shiftType: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  station: string;
  status: string;
  notes?: string;
}

export function SchedulesView() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [personTypeFilter, setPersonTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  // New Shift Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShift, setNewShift] = useState({
    personName: "",
    personType: "staff",
    role: "Nurse",
    department: "Cardiology",
    shiftType: "morning",
    dayOfWeek: "Monday",
    startTime: "08:00 AM",
    endTime: "04:00 PM",
    station: "Triage Desk A",
    notes: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dayFilter !== "all") params.append("dayOfWeek", dayFilter);
      if (shiftFilter !== "all") params.append("shiftType", shiftFilter);
      if (personTypeFilter !== "all") params.append("personType", personTypeFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/schedules?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSchedules(data.schedules || []);
      }
    } catch (err) {
      console.error("Error loading schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [dayFilter, shiftFilter, personTypeFilter]);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShift),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create duty shift");
      }
      setShowAddModal(false);
      setNewShift({
        personName: "",
        personType: "staff",
        role: "Nurse",
        department: "Cardiology",
        shiftType: "morning",
        dayOfWeek: "Monday",
        startTime: "08:00 AM",
        endTime: "04:00 PM",
        station: "Triage Desk A",
        notes: "",
      });
      fetchSchedules();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create shift");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <AdminShell activeKey="schedules">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Staff & Doctor Duty Schedules
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Duty shift roster, operational working hours, and station coverage. (Not patient appointments).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchSchedules}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
            >
              <RefreshIcon className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Assign Duty Shift
            </button>
          </div>
        </div>

        {/* Days of Week Tab Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
          <button
            onClick={() => setDayFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              dayFilter === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Days
          </button>
          {daysOfWeek.map((day) => (
            <button
              key={day}
              onClick={() => setDayFilter(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                dayFilter === day
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Secondary Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchSchedules()}
              placeholder="Search personnel, role, station..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Personnel:</span>
              <select
                value={personTypeFilter}
                onChange={(e) => setPersonTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
              >
                <option value="all">All Personnel</option>
                <option value="doctor">Doctors</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Shift:</span>
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
              >
                <option value="all">All Shifts</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="full_day">Full Day</option>
                <option value="on_call">On-Call</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Roster Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading duty rosters...</div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <SchedulesIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No shifts scheduled</h3>
              <p className="text-sm text-slate-500 mt-1">
                Assign a personnel shift to establish duty coverage for this schedule window.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Assigned Personnel</th>
                    <th className="py-3 px-4">Role & Department</th>
                    <th className="py-3 px-4">Shift Type</th>
                    <th className="py-3 px-4">Time Window</th>
                    <th className="py-3 px-4">Station / Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        {s.dayOfWeek}
                      </td>
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/schedules/${s._id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              s.personType === "doctor" ? "bg-indigo-600" : "bg-blue-600"
                            }`}
                          ></span>
                          {s.personName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium">{s.role}</div>
                        <div className="text-xs text-slate-400">{s.department}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {s.shiftType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {s.startTime} - {s.endTime}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{s.station}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            s.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/schedules/${s._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Details
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Shift Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Assign Duty Shift</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateShift} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Personnel Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newShift.personName}
                    onChange={(e) => setNewShift({ ...newShift, personName: e.target.value })}
                    placeholder="e.g. Arun Mary or Dr. Rajesh Kumar"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Personnel Type
                    </label>
                    <select
                      value={newShift.personType}
                      onChange={(e) => setNewShift({ ...newShift, personType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="staff">Staff</option>
                      <option value="doctor">Doctor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Role Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newShift.role}
                      onChange={(e) => setNewShift({ ...newShift, role: e.target.value })}
                      placeholder="e.g. Registered Nurse"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      value={newShift.department}
                      onChange={(e) => setNewShift({ ...newShift, department: e.target.value })}
                      placeholder="e.g. Cardiology"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Day of Week *
                    </label>
                    <select
                      value={newShift.dayOfWeek}
                      onChange={(e) => setNewShift({ ...newShift, dayOfWeek: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      {daysOfWeek.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Shift Type
                    </label>
                    <select
                      value={newShift.shiftType}
                      onChange={(e) => setNewShift({ ...newShift, shiftType: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                      <option value="full_day">Full Day</option>
                      <option value="on_call">On-Call</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      Start Time
                    </label>
                    <input
                      type="text"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                      End Time
                    </label>
                    <input
                      type="text"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Station / Duty Desk *
                  </label>
                  <input
                    type="text"
                    required
                    value={newShift.station}
                    onChange={(e) => setNewShift({ ...newShift, station: e.target.value })}
                    placeholder="e.g. Main Desk 1 or Suite 405"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
                  >
                    {createLoading ? "Saving..." : "Save Shift"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
