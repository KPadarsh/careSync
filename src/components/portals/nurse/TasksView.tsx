"use client";

import React, { useState, useEffect } from "react";
import {
  TasksIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PlusIcon,
  CheckIcon,
  RefreshIcon,
} from "./NurseIcons";

export const TasksView: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all", "pending", "completed"

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [patientName, setPatientName] = useState("");
  const [roomNumber, setRoomNumber] = useState("Room 302");
  const [dueTime, setDueTime] = useState("11:30 AM");
  const [priority, setPriority] = useState<"normal" | "urgent">("normal");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      const url = filter === "all" ? "/api/nurse/tasks" : `/api/nurse/tasks?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setTasks(json.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const handleToggle = async (taskId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "completed" ? "pending" : "completed";
      const res = await fetch("/api/nurse/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Failed to toggle task:", err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSaving(true);
      const res = await fetch("/api/nurse/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          patientName: patientName.trim(),
          roomNumber,
          dueTime,
          priority,
          category,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setPatientName("");
        setShowModal(false);
        fetchTasks();
      }
    } catch (err) {
      console.error("Create task error:", err);
    } finally {
      setSaving(false);
    }
  };

  const pendingCount = tasks.filter((t) => t.status !== "completed").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">Nursing Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            Task checklist, medication delivery windows, and routine station procedures.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00355f] text-white text-xs font-semibold hover:bg-[#0f4c81] shadow-2xs self-start sm:self-auto"
        >
          <PlusIcon size={14} />
          <span>New Nursing Task</span>
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            filter === "all" ? "bg-[#00355f] text-white" : "bg-white border border-slate-200 text-slate-700"
          }`}
        >
          All Tasks ({tasks.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            filter === "pending" ? "bg-[#00355f] text-white" : "bg-white border border-slate-200 text-slate-700"
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("completed")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            filter === "completed" ? "bg-[#00355f] text-white" : "bg-white border border-slate-200 text-slate-700"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* TASKS LIST */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">No tasks found.</div>
        ) : (
          tasks.map((task) => {
            const isDone = task.status === "completed";
            const isUrgent = task.priority === "urgent";

            return (
              <div
                key={task._id}
                className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                  isDone
                    ? "bg-slate-50/60 border-slate-200 opacity-60"
                    : isUrgent
                    ? "bg-rose-50/30 border-rose-200 shadow-2xs"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(task._id, task.status)}
                  className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-colors flex-shrink-0 ${
                    isDone
                      ? "bg-teal-600 border-teal-600 text-white"
                      : "border-slate-300 hover:border-teal-600"
                  }`}
                >
                  {isDone && <CheckIcon size={14} />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-semibold leading-tight ${
                        isDone ? "line-through text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isUrgent ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {task.priority}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {task.dueTime}
                      </span>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                    {task.patientName && (
                      <span>Patient: <strong className="text-slate-800">{task.patientName}</strong></span>
                    )}
                    <span>•</span>
                    <span>Room: <strong className="text-slate-800">{task.roomNumber}</strong></span>
                    <span>•</span>
                    <span className="capitalize text-teal-700 font-medium">{task.category}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE TASK MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Create Nursing Task</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Administer IV antibiotic, Check vitals in Bay 2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Clinical Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Specific dosage, precautions, or triage instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Patient Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus Chen"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Location / Room
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Due Time
                  </label>
                  <input
                    type="text"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-medium"
                  >
                    <option value="general">General</option>
                    <option value="medication">Medication</option>
                    <option value="vitals">Vitals</option>
                    <option value="wound-care">Wound Care</option>
                    <option value="handoff">Doctor Handoff</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Priority</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === "normal"}
                      onChange={() => setPriority("normal")}
                    />
                    <span>Normal Priority</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-rose-700 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={priority === "urgent"}
                      onChange={() => setPriority("urgent")}
                    />
                    <span className="font-bold">Urgent</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-[#00355f] text-white text-xs font-semibold hover:bg-[#0f4c81]"
                >
                  {saving ? "Creating..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
