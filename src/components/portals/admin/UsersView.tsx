"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AdminShell,
  UsersIcon,
  SearchIcon,
  PlusIcon,
  RefreshIcon,
  ChevronRightIcon,
  LockIcon,
  ShieldIcon,
} from "./AdminShell";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  status: "active" | "inactive";
  createdAt: string;
}

export function UsersView() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // New User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "Password123!",
    role: "reception",
    phone: "",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create user account");
      }
      setShowAddModal(false);
      setNewUser({
        name: "",
        email: "",
        password: "Password123!",
        role: "reception",
        phone: "",
      });
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <AdminShell activeKey="users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              User Accounts & System RBAC Roles
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Govern user credentials, role segregation policies, and account access across all 9 CareSync subsystems.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
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
              Provision Account
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              placeholder="Search by name, email, phone..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Subsystem Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="reception">Receptionist</option>
                <option value="lab_technician">Lab Technician</option>
                <option value="pathologist">Pathologist</option>
                <option value="pharmacy">Pharmacist</option>
                <option value="billing">Billing Staff</option>
                <option value="patient">Patient</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading user accounts...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <UsersIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">No user accounts found</h3>
              <p className="text-sm text-slate-500 mt-1">Adjust your search or register an account.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Account User</th>
                    <th className="py-3 px-4">Role Privileges</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/users/${u._id}`}
                          className="font-medium text-slate-900 hover:text-indigo-600 block"
                        >
                          {u.name}
                        </Link>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`capitalize text-xs font-bold px-2 py-0.5 rounded-full border ${
                            u.role === "admin"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : u.role === "doctor"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : u.role === "nurse"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : u.role === "billing"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-50 text-slate-700 border-slate-200"
                          }`}
                        >
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{u.phone || "—"}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            u.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/users/${u._id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Manage
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

        {/* Provision Account Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Provision User Account</h3>
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

              <form onSubmit={handleCreateUser} className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="user@caresync.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Subsystem Role *
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="reception">Receptionist</option>
                    <option value="nurse">Nurse</option>
                    <option value="doctor">Doctor</option>
                    <option value="lab_technician">Lab Technician</option>
                    <option value="pathologist">Pathologist</option>
                    <option value="pharmacy">Pharmacist</option>
                    <option value="billing">Billing Staff</option>
                    <option value="admin">Administrator</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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
                    {createLoading ? "Creating..." : "Provision User"}
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
