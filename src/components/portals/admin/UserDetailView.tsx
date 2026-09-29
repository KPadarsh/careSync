"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  ArrowLeftIcon,
  UsersIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  LockIcon,
  ShieldIcon,
  BuildingIcon,
  StaffIcon,
} from "./AdminShell";

interface UserDetailViewProps {
  id: string;
}

export function UserDetailView({ id }: UserDetailViewProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedRole, setSelectedRole] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  const fetchUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "User account not found");
      }
      setUser(data.user);
      setSelectedRole(data.user.role);
    } catch (err: any) {
      setError(err.message || "Failed to load user account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  const handleRoleChange = async () => {
    if (!user || selectedRole === user.role) return;
    if (
      !confirm(
        `Are you sure you want to change role from "${user.role}" to "${selectedRole}"? This will modify the user's subsystem access privileges.`
      )
    ) {
      return;
    }

    setUpdatingRole(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update role");
      }
      setUser({ ...user, role: data.user.role });
      setSuccess(`Role successfully updated to ${data.user.role}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Role change rejected");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change status");
      }
      setUser({ ...user, status: data.user.status });
      setSuccess(`Account status updated to ${data.user.status}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Status change failed");
    }
  };

  if (loading) {
    return (
      <AdminShell activeKey="users">
        <div className="p-12 text-center text-slate-400">Loading user account...</div>
      </AdminShell>
    );
  }

  if (error || !user) {
    return (
      <AdminShell activeKey="users">
        <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
          <AlertTriangleIcon className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">User Account Not Found</h2>
          <p className="text-sm text-slate-500">{error || "Requested user account does not exist."}</p>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Users Directory
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeKey="users">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Users Directory
          </Link>

          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              user.status === "active"
                ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            {user.status === "active" ? "Deactivate User Account" : "Activate User Account"}
          </button>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* User Profile Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-700">
                {user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                      user.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">{user.email}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Registered: {new Date(user.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Active Privilege Role
              </span>
              <span className="capitalize text-sm font-bold text-indigo-600">
                {user.role.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Role Privileges & Safe Authorization Section */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-slate-900 text-sm">
            <ShieldIcon className="w-4 h-4 text-indigo-600" />
            Role-Based Access Control (RBAC) Management
          </div>

          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-amber-800">
              <LockIcon className="w-3.5 h-3.5" />
              Privilege Modification Governance
            </div>
            <p>
              Reassigning a user&apos;s role immediately adjusts their subsystem routing and API authorization
              boundaries. Changes are recorded in the server-side immutable audit log.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Assign Subsystem Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm capitalize"
              >
                <option value="admin">Administrator (Complete Operations & System)</option>
                <option value="doctor">Doctor (Clinical Consultations & Prescriptions)</option>
                <option value="nurse">Nurse (Triage, Assessments & Inpatient Tasks)</option>
                <option value="reception">Receptionist (Front Desk & Appointments)</option>
                <option value="lab_technician">Lab Technician (Clinical Tests & Processing)</option>
                <option value="pathologist">Pathologist (Diagnostic Reviews & Verification)</option>
                <option value="pharmacy">Pharmacist (Inventory & Medication Dispensing)</option>
                <option value="billing">Billing Staff (Invoices, Receipts & Payments)</option>
                <option value="patient">Patient (Personal Health Portal)</option>
              </select>
            </div>

            <div className="sm:self-end">
              <button
                onClick={handleRoleChange}
                disabled={updatingRole || selectedRole === user.role}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                {updatingRole ? "Authorizing..." : "Update Role Privileges"}
              </button>
            </div>
          </div>
        </div>

        {/* Linked Staff / Doctor Profile */}
        {(user.staffProfile || user.doctorProfile) && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900 text-sm">
              <BuildingIcon className="w-4 h-4 text-blue-600" />
              Linked Facility Profile
            </div>

            {user.staffProfile && (
              <div className="text-xs space-y-1">
                <div className="font-semibold text-slate-800">
                  Staff Member: {user.staffProfile.fullName} ({user.staffProfile.employeeId})
                </div>
                <div className="text-slate-500">
                  Department: {user.staffProfile.department} • Shift: {user.staffProfile.shift}
                </div>
                <Link
                  href={`/admin/staff/${user.staffProfile._id}`}
                  className="text-indigo-600 font-semibold inline-block pt-1 hover:underline"
                >
                  View Full Staff Record →
                </Link>
              </div>
            )}

            {user.doctorProfile && (
              <div className="text-xs space-y-1">
                <div className="font-semibold text-slate-800">
                  Doctor: {user.doctorProfile.name} ({user.doctorProfile.specialty})
                </div>
                <div className="text-slate-500">
                  Department: {user.doctorProfile.department} • Room: {user.doctorProfile.roomNumber}
                </div>
                <Link
                  href={`/admin/doctors/${user.doctorProfile._id}`}
                  className="text-indigo-600 font-semibold inline-block pt-1 hover:underline"
                >
                  View Full Physician Profile →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
