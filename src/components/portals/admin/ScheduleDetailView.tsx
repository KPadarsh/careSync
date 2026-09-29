"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AdminShell,
  ArrowLeftIcon,
  SchedulesIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
  BuildingIcon,
} from "./AdminShell";

interface ScheduleDetailViewProps {
  id: string;
}

export function ScheduleDetailView({ id }: ScheduleDetailViewProps) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    personName: "",
    role: "",
    department: "",
    shiftType: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    station: "",
    status: "",
    notes: "",
  });

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/schedules/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Schedule not found");
      }
      setSchedule(data.schedule);
      setEditForm({
        personName: data.schedule.personName || "",
        role: data.schedule.role || "",
        department: data.schedule.department || "",
        shiftType: data.schedule.shiftType || "morning",
        dayOfWeek: data.schedule.dayOfWeek || "Monday",
        startTime: data.schedule.startTime || "",
        endTime: data.schedule.endTime || "",
        station: data.schedule.station || "",
        status: data.schedule.status || "scheduled",
        notes: data.schedule.notes || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setSchedule(data.schedule);
        setIsEditing(false);
        setSuccess("Shift schedule updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error saving schedule:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this shift schedule assignment?")) return;
    try {
      const res = await fetch(`/api/admin/schedules/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/schedules");
      }
    } catch (err) {
      console.error("Error deleting schedule:", err);
    }
  };

  if (loading) {
    return (
      <AdminShell activeKey="schedules">
        <div className="p-12 text-center text-slate-400">Loading duty shift details...</div>
      </AdminShell>
    );
  }

  if (error || !schedule) {
    return (
      <AdminShell activeKey="schedules">
        <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
          <AlertTriangleIcon className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Shift Schedule Not Found</h2>
          <p className="text-sm text-slate-500">{error || "Requested shift does not exist."}</p>
          <Link
            href="/admin/schedules"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Schedules
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeKey="schedules">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/schedules"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Schedules
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
            >
              <EditIcon className="w-3.5 h-3.5 text-slate-500" />
              {isEditing ? "Cancel" : "Edit Shift"}
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
            >
              <TrashIcon className="w-3.5 h-3.5 text-rose-600" />
              Delete Shift
            </button>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Schedule Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                {schedule.dayOfWeek} Roster
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-2">{schedule.personName}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {schedule.role} • {schedule.department}
              </p>
            </div>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                schedule.status === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {schedule.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Shift Window:</span>
              <span className="font-mono font-medium text-slate-800">
                {schedule.startTime} - {schedule.endTime}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Assigned Station:</span>
              <span className="font-medium text-slate-800">{schedule.station}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Shift Type:</span>
              <span className="font-medium text-slate-800 capitalize">
                {schedule.shiftType.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {isEditing && (
          <form onSubmit={handleSaveEdit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Modify Shift Allocation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Personnel Name
                </label>
                <input
                  type="text"
                  value={editForm.personName}
                  onChange={(e) => setEditForm({ ...editForm, personName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  value={editForm.startTime}
                  onChange={(e) => setEditForm({ ...editForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  End Time
                </label>
                <input
                  type="text"
                  value={editForm.endTime}
                  onChange={(e) => setEditForm({ ...editForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Station / Location
                </label>
                <input
                  type="text"
                  value={editForm.station}
                  onChange={(e) => setEditForm({ ...editForm, station: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active (On Duty)</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  );
}
