"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  ArrowLeftIcon,
  DepartmentsIcon,
  DoctorsIcon,
  StaffIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  EditIcon,
  BuildingIcon,
  ClockIcon,
} from "./AdminShell";

interface DepartmentDetailViewProps {
  id: string;
}

export function DepartmentDetailView({ id }: DepartmentDetailViewProps) {
  const [department, setDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    description: "",
    headOfDepartment: "",
    location: "",
    phone: "",
    email: "",
    startTime: "08:00 AM",
    endTime: "08:00 PM",
  });

  const fetchDepartment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/departments/${id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Department not found");
      }
      setDepartment(data.department);
      setEditForm({
        name: data.department.name || "",
        code: data.department.code || "",
        description: data.department.description || "",
        headOfDepartment: data.department.headOfDepartment || "",
        location: data.department.location || "",
        phone: data.department.phone || "",
        email: data.department.email || "",
        startTime: data.department.operatingHours?.start || "08:00 AM",
        endTime: data.department.operatingHours?.end || "08:00 PM",
      });
    } catch (err: any) {
      setError(err.message || "Failed to load department details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartment();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!department) return;
    const newStatus = department.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setDepartment({ ...department, status: newStatus });
        setSuccess(`Department status updated to ${newStatus}`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          code: editForm.code,
          description: editForm.description,
          headOfDepartment: editForm.headOfDepartment,
          location: editForm.location,
          phone: editForm.phone,
          email: editForm.email,
          operatingHours: {
            start: editForm.startTime,
            end: editForm.endTime,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDepartment(data.department);
        setIsEditing(false);
        setSuccess("Department details updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error saving department:", err);
    }
  };

  if (loading) {
    return (
      <AdminShell activeKey="departments">
        <div className="p-12 text-center text-slate-400">Loading department details...</div>
      </AdminShell>
    );
  }

  if (error || !department) {
    return (
      <AdminShell activeKey="departments">
        <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
          <AlertTriangleIcon className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-800">Department Not Found</h2>
          <p className="text-sm text-slate-500">{error || "Requested department does not exist."}</p>
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Departments
          </Link>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell activeKey="departments">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/departments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Back to Departments
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
            >
              <EditIcon className="w-3.5 h-3.5 text-slate-500" />
              {isEditing ? "Cancel Edit" : "Edit Department"}
            </button>
            <button
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                department.status === "active"
                  ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {department.status === "active" ? "Set Inactive" : "Set Active"}
            </button>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* Header Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-bold font-mono text-indigo-700">
              {department.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{department.name}</h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    department.status === "active"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {department.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">{department.description}</p>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                <span>Location: {department.location}</span>
                <span>•</span>
                <span>Head: {department.headOfDepartment || "Unassigned"}</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs font-semibold text-slate-600 border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-between sm:justify-center">
            <div className="flex items-center gap-1.5 text-indigo-600">
              <DoctorsIcon className="w-4 h-4" />
              <span>{department.assignedDoctors?.length || 0} Assigned Doctors</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600">
              <StaffIcon className="w-4 h-4" />
              <span>{department.assignedStaff?.length || 0} Assigned Staff</span>
            </div>
          </div>
        </div>

        {isEditing && (
          <form onSubmit={handleSaveEdit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Edit Department Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Head of Department
                </label>
                <input
                  type="text"
                  value={editForm.headOfDepartment}
                  onChange={(e) => setEditForm({ ...editForm, headOfDepartment: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Location / Suite
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Direct Phone
                </label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
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

        {/* Assigned Doctors Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <DoctorsIcon className="w-4 h-4 text-indigo-600" />
              Assigned Doctors ({department.assignedDoctors?.length || 0})
            </div>
            <Link
              href="/admin/doctors/new"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Assign Doctor
            </Link>
          </div>

          {!department.assignedDoctors?.length ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No doctors currently assigned to this department.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Doctor Name</th>
                    <th className="py-2.5 px-4">Specialty</th>
                    <th className="py-2.5 px-4">Consultation Room</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {department.assignedDoctors.map((doc: any) => (
                    <tr key={doc._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-medium text-slate-900">{doc.name}</td>
                      <td className="py-3 px-4 text-slate-600">{doc.specialty}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono">{doc.roomNumber}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 text-[10px]">
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/doctors/${doc._id}`}
                          className="text-indigo-600 font-semibold hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assigned Staff Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <StaffIcon className="w-4 h-4 text-blue-600" />
              Assigned Staff ({department.assignedStaff?.length || 0})
            </div>
            <Link
              href="/admin/staff/new"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Assign Staff
            </Link>
          </div>

          {!department.assignedStaff?.length ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No staff members currently assigned to this department.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-2.5 px-4">Employee ID</th>
                    <th className="py-2.5 px-4">Staff Member</th>
                    <th className="py-2.5 px-4">Role / Title</th>
                    <th className="py-2.5 px-4">Shift</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {department.assignedStaff.map((st: any) => (
                    <tr key={st._id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">{st.employeeId}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {st.fullName}
                        <div className="text-[10px] text-slate-400">{st.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 capitalize">
                        {st.role.replace("_", " ")} • {st.designation}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{st.shift}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 text-[10px]">
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/staff/${st._id}`}
                          className="text-indigo-600 font-semibold hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
