"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  ArrowLeftIcon,
  StaffIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  EditIcon,
  RefreshIcon,
  BuildingIcon,
  ClockIcon,
} from "./AdminShell";

interface StaffDetailViewProps {
  id: string;
}

export function StaffDetailView({ id }: StaffDetailViewProps) {
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    phone: "",
    department: "",
    designation: "",
    shift: "",
    emergencyContact: "",
    qualifications: "",
    notes: "",
  });

  const fetchStaffDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Staff record not found");
      }
      setStaff(data.staff);
      setEditForm({
        fullName: data.staff.fullName || "",
        phone: data.staff.phone || "",
        department: data.staff.department || "",
        designation: data.staff.designation || "",
        shift: data.staff.shift || "",
        emergencyContact: data.staff.emergencyContact || "",
        qualifications: data.staff.qualifications || "",
        notes: data.staff.notes || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load staff record");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffDetails();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!staff) return;
    const newStatus = staff.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff);
        setSuccess(`Staff status updated to ${newStatus}`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff);
        setIsEditing(false);
        setSuccess("Staff profile updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error saving edits:", err);
    }
  };

  if (loading) {
    return (
      <AdminShell activeKey="staff">
        <div className="p-12 text-center text-slate-400">Loading staff details...</div>
      </AdminShell>
    );
  }

  if (error || !staff) {
    return (
      <AdminShell activeKey="staff">
        <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
          <AlertTriangleIcon className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Staff Record Not Found</h2>
          <p className="text-sm text-slate-500">{error || "Requested staff ID does not exist."}</p>
          <Link
            href="/admin/staff"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Return to Staff List
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeKey="staff">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back link */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/staff"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Staff Directory
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
            >
              <EditIcon className="w-3.5 h-3.5 text-slate-500" />
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </button>
            <button
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                staff.status === "active"
                  ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {staff.status === "active" ? "Deactivate Account" : "Activate Account"}
            </button>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700">
              {staff.fullName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{staff.fullName}</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    staff.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {staff.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {staff.designation || staff.role} • {staff.department}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                ID: {staff.employeeId} • Joined: {new Date(staff.joinedDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSaveEdit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Edit Staff Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
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
                  Job Designation
                </label>
                <input
                  type="text"
                  value={editForm.designation}
                  onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Shift Schedule
                </label>
                <input
                  type="text"
                  value={editForm.shift}
                  onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={editForm.emergencyContact}
                  onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Qualifications & Certifications
              </label>
              <input
                type="text"
                value={editForm.qualifications}
                onChange={(e) => setEditForm({ ...editForm, qualifications: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Administrative Notes
              </label>
              <textarea
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
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
        ) : (
          /* View Details */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Contact & Account Information
              </h2>
              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-400 block">Email Address:</span>
                  <span className="text-slate-800 font-medium">{staff.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Number:</span>
                  <span className="text-slate-800 font-medium">{staff.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Emergency Contact:</span>
                  <span className="text-slate-800 font-medium">
                    {staff.emergencyContact || "Not Specified"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">System User Linked:</span>
                  <span className="text-slate-800 font-medium">
                    {staff.userId ? "Provisioned & Synchronized" : "Unlinked"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Operational Placement
              </h2>
              <div className="text-xs space-y-3">
                <div>
                  <span className="text-slate-400 block">Department:</span>
                  <span className="text-slate-800 font-medium">{staff.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Role:</span>
                  <span className="text-slate-800 font-medium capitalize">
                    {staff.role.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Default Shift:</span>
                  <span className="text-slate-800 font-medium">{staff.shift}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Qualifications:</span>
                  <span className="text-slate-800 font-medium">
                    {staff.qualifications || "Not Specified"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Administrative Notes Box */}
        {staff.notes && !isEditing && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <span className="font-semibold text-slate-700 block mb-1">Supervisory Notes:</span>
            <p className="text-slate-600">{staff.notes}</p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
