"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  TrashIcon,
} from "./AdminShell";

interface StaffDetailViewProps {
  id: string;
}

export function StaffDetailView({ id }: StaffDetailViewProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
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
    password: "",
  });

  // Manual Password Assignment State
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

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
        password: "",
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
        setError(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to update staff status");
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      setError(err.message || "Failed to update status");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }
    setResettingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update staff password");
      }
      setPasswordSuccess("Staff password updated successfully. Active sessions revoked.");
      setNewPassword("");
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: Record<string, any> = { ...editForm };
      if (!payload.password) {
        delete payload.password;
      }
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStaff(data.staff);
        setIsEditing(false);
        setSuccess("Staff profile updated successfully");
        setError(null);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to update staff profile");
      }
    } catch (err: any) {
      console.error("Error saving edits:", err);
      setError(err.message || "Failed to save edits");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to permanently delete staff member ${staff?.fullName || "this staff member"}? This will permanently remove their profile and login account from the database.`
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete staff member");
      }
      setSuccess("Staff member permanently deleted. Redirecting to directory...");
      setTimeout(() => {
        router.push("/admin/staff");
      }, 1000);
    } catch (err: any) {
      console.error("Error deleting staff:", err);
      setError(err.message || "Failed to delete staff member");
      setDeleting(false);
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
                  ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {staff.status === "active" ? "Deactivate Account" : "Activate Account"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <TrashIcon className="w-3.5 h-3.5 text-rose-600" />
              {deleting ? "Deleting..." : "Delete Staff"}
            </button>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-sm">
            <AlertTriangleIcon className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
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

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Reset Account Password (Optional)
              </label>
              <input
                type="text"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="Leave blank to keep existing password unchanged"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Enter at least 8 characters if you wish to reset this staff member's password now.
              </span>
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

            {/* Account Access & Password Management Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Account Security & Login Password
                </h2>
                <span className="text-xs text-slate-500 font-medium">
                  Admin Manual Password Assignment
                </span>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-800 text-xs">
                  <AlertTriangleIcon className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="text-xs space-y-1.5 text-slate-600">
                  <p>
                    <strong>Login Username:</strong> <span className="font-mono text-slate-800">{staff.email}</span>
                  </p>
                  <p>
                    Admin can directly assign or reset the password for this staff member at any time. When updated, active sessions will be terminated and the staff member can immediately log in with the new password.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <div className="relative w-full sm:w-64">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 8)..."
                      className="w-full px-3 py-2 pr-16 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-500 hover:text-slate-800 px-1 py-0.5"
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={resettingPassword || !newPassword}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition shadow-sm"
                  >
                    {resettingPassword ? "Updating..." : "Set New Password"}
                  </button>
                </form>
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
