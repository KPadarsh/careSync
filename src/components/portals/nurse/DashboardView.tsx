"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  TasksIcon,
  VitalsIcon,
  AssessmentIcon,
  RefreshIcon,
  UserIcon,
  ChevronRightIcon,
  PlusIcon,
  CheckIcon,
} from "./NurseIcons";

interface DashboardData {
  metrics: {
    patientsWaiting: number;
    assessmentsPending: number;
    readyForDoctor: number;
    tasksDue: number;
  };
  todayPatients: any[];
  needingAttention: any[];
  nursingTasks: any[];
  nurse: {
    name: string;
    email: string;
    role: string;
    station: string;
    shift: string;
  };
}

export const DashboardView: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New task inline state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("11:30 AM");
  const [taskPriority, setTaskPriority] = useState<"normal" | "urgent">("normal");
  const [taskRoom, setTaskRoom] = useState("Room 302");
  const [savingTask, setSavingTask] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/nurse/dashboard");
      if (!res.ok) {
        throw new Error("Failed to load nurse workstation dashboard");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "completed" ? "pending" : "completed";
      const res = await fetch("/api/nurse/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Task toggle error:", err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    try {
      setSavingTask(true);
      const res = await fetch("/api/nurse/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          dueTime: taskDueTime,
          priority: taskPriority,
          roomNumber: taskRoom,
        }),
      });
      if (res.ok) {
        setTaskTitle("");
        setShowNewTaskModal(false);
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Create task error:", err);
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#006a61] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-slate-600">Loading Nurse Workstation...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
        <h3 className="font-semibold text-base mb-1">Workstation Offline or Error</h3>
        <p className="text-sm mb-4">{error || "Failed to retrieve workstation data"}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, todayPatients, needingAttention, nursingTasks, nurse } = data;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#00355f]">Nurse Workstation</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[11px] font-semibold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
              Live Shift
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Logged in as <strong className="font-semibold text-slate-700">{nurse.name}</strong> •{" "}
            {nurse.station}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-all"
          >
            <RefreshIcon size={14} className={refreshing ? "animate-spin text-teal-600" : "text-slate-500"} />
            <span>{refreshing ? "Refreshing..." : "Refresh Queue"}</span>
          </button>

          <Link
            href="/nurse/queue"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00355f] text-white hover:bg-[#0f4c81] text-xs font-semibold shadow-xs transition-all"
          >
            <span>Open Patient Queue</span>
            <ChevronRightIcon size={14} />
          </Link>
        </div>
      </div>

      {/* 4 PRIMARY DASHBOARD TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Patients Waiting */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Patients Waiting
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-extrabold text-[#00355f]">{metrics.patientsWaiting}</span>
              <span className="text-xs text-slate-500">for triage</span>
            </div>
            <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <ClockIcon size={13} className="text-amber-500" />
              <span>Awaiting vitals intake</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#00355f] flex items-center justify-center">
            <ClockIcon size={24} />
          </div>
        </div>

        {/* Tile 2: Assessments Pending */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Assessments Pending
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-extrabold text-amber-600">{metrics.assessmentsPending}</span>
              <span className="text-xs text-slate-500">in triage</span>
            </div>
            <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <VitalsIcon size={13} className="text-amber-600" />
              <span>Draft &amp; active evaluations</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AssessmentIcon size={24} />
          </div>
        </div>

        {/* Tile 3: Ready for Doctor */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Ready for Doctor
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-extrabold text-[#006a61]">{metrics.readyForDoctor}</span>
              <span className="text-xs text-slate-500">cleared</span>
            </div>
            <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <CheckCircleIcon size={13} className="text-[#006a61]" />
              <span>Triage notes finalized</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#006a61] flex items-center justify-center">
            <CheckCircleIcon size={24} />
          </div>
        </div>

        {/* Tile 4: Tasks Due */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tasks Due
            </span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-extrabold text-rose-600">{metrics.tasksDue}</span>
              <span className="text-xs text-slate-500">pending</span>
            </div>
            <span className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <TasksIcon size={13} className="text-rose-500" />
              <span>Nursing responsibilities</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TasksIcon size={24} />
          </div>
        </div>
      </div>

      {/* PATIENTS NEEDING ATTENTION (ALERT BANNER IF ANY) */}
      {needingAttention && needingAttention.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangleIcon size={18} className="text-amber-600 flex-shrink-0" />
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
              Patients Needing Immediate Nursing Attention ({needingAttention.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {needingAttention.slice(0, 3).map((item: any) => {
              const patientName = `${item.patientId?.firstName || ""} ${item.patientId?.lastName || item.patientId?.userId?.name || "Patient"}`;
              const pId = item.patientId?._id;
              const pain = item.latestAssessment?.vitals?.painScore;
              const bp = item.latestAssessment?.vitals?.bloodPressure;
              const hr = item.latestAssessment?.vitals?.heartRate;

              return (
                <div
                  key={item._id}
                  className="p-3 bg-white rounded-lg border border-amber-200/90 shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{patientName}</span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold uppercase">
                        {item.priority}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Token: <strong className="font-semibold text-slate-800">{item.ticketNumber}</strong> •{" "}
                      {item.department} ({item.roomNumber || "Room 302"})
                    </div>
                    <div className="mt-2 text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded">
                      {bp && <span>BP: <strong className="text-rose-600">{bp}</strong> </span>}
                      {hr && <span>• HR: <strong>{hr} bpm</strong> </span>}
                      {pain !== undefined && pain > 0 && <span>• Pain: <strong>{pain}/10</strong></span>}
                      {!bp && !hr && <span>Awaiting priority vitals triage.</span>}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Link
                      href={`/nurse/vitals/${pId}`}
                      className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium"
                    >
                      Record Vitals
                    </Link>
                    <Link
                      href={`/nurse/assessments/${pId}`}
                      className="px-2.5 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold"
                    >
                      Assess Patient
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TWO COLUMN WORKSTATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT / CENTER: TODAY'S PATIENTS & QUEUE (COL SPAN 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00355f]"></div>
                <h3 className="font-bold text-slate-900 text-sm">Today&apos;s Clinic Patients</h3>
                <span className="text-xs text-slate-500">({todayPatients.length})</span>
              </div>
              <Link
                href="/nurse/queue"
                className="text-xs font-semibold text-[#006a61] hover:underline flex items-center gap-1"
              >
                <span>View Full Queue</span>
                <ChevronRightIcon size={12} />
              </Link>
            </div>

            {todayPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No patients currently checked in for triage.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3.5">Token</th>
                      <th className="py-3 px-3.5">Patient</th>
                      <th className="py-3 px-3.5">Doctor &amp; Room</th>
                      <th className="py-3 px-3.5">Priority</th>
                      <th className="py-3 px-3.5">Status</th>
                      <th className="py-3 px-3.5 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {todayPatients.slice(0, 7).map((item: any) => {
                      const patient = item.patientId;
                      const patientName = `${patient?.firstName || ""} ${patient?.lastName || patient?.userId?.name || "Patient"}`;
                      const pId = patient?._id;
                      const isWaiting = item.status === "waiting";
                      const isInAssessment = item.status === "in-assessment";
                      const isReady = item.status === "ready-for-doctor";

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                            <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                              {item.ticketNumber}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="flex flex-col">
                              <Link
                                href={`/nurse/patients/${pId}`}
                                className="font-semibold text-slate-900 hover:text-[#006a61] hover:underline"
                              >
                                {patientName}
                              </Link>
                              <span className="text-[11px] text-slate-500">
                                {patient?.gender || "M"} • MRN: {patient?.mrn || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">{item.doctorId?.name || "Dr. Assigned"}</span>
                              <span className="text-[11px] text-slate-500">{item.roomNumber || "Room 302"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                item.priority === "urgent"
                                  ? "bg-rose-100 text-rose-800"
                                  : item.priority === "priority"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.priority}
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                isWaiting
                                  ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                                  : isInAssessment
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : isReady
                                  ? "bg-teal-50 text-teal-700 border border-teal-200/60"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {item.status.replace("-", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-right pr-4">
                            {isWaiting && (
                              <Link
                                href={`/nurse/assessments/${pId}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#00355f] text-white hover:bg-[#0f4c81] text-xs font-semibold shadow-2xs"
                              >
                                <span>Start Assessment</span>
                              </Link>
                            )}
                            {isInAssessment && (
                              <Link
                                href={`/nurse/assessments/${pId}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold shadow-2xs"
                              >
                                <span>Continue</span>
                              </Link>
                            )}
                            {isReady && (
                              <Link
                                href={`/nurse/patients/${pId}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-teal-600 text-white hover:bg-teal-700 text-xs font-semibold shadow-2xs"
                              >
                                <span>Doctor Handoff</span>
                              </Link>
                            )}
                            {!isWaiting && !isInAssessment && !isReady && (
                              <Link
                                href={`/nurse/patients/${pId}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-medium"
                              >
                                <span>View Chart</span>
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: NURSING TASKS & QUICK ACTIONS (COL SPAN 1) */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TasksIcon size={16} className="text-[#006a61]" />
                <h3 className="font-bold text-slate-900 text-sm">Nursing Tasks</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#006a61] hover:bg-teal-50 px-2 py-1 rounded-md transition-colors"
              >
                <PlusIcon size={12} />
                <span>New Task</span>
              </button>
            </div>

            {nursingTasks.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No pending tasks for this station.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {nursingTasks.slice(0, 6).map((task: any) => {
                  const isDone = task.status === "completed";
                  const isUrgent = task.priority === "urgent";

                  return (
                    <div
                      key={task._id}
                      className={`p-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
                        isDone
                          ? "bg-slate-50/70 border-slate-200 opacity-60"
                          : isUrgent
                          ? "bg-rose-50/40 border-rose-200"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task._id, task.status)}
                        className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-colors flex-shrink-0 ${
                          isDone
                            ? "bg-teal-600 border-teal-600 text-white"
                            : "border-slate-300 hover:border-teal-600"
                        }`}
                      >
                        {isDone && <CheckIcon size={12} />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-xs block font-semibold leading-tight ${
                            isDone ? "line-through text-slate-400" : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          {task.patientName && <span>{task.patientName}</span>}
                          <span>•</span>
                          <span>{task.dueTime}</span>
                          {isUrgent && (
                            <span className="font-bold text-rose-600 uppercase">Urgent</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              href="/nurse/tasks"
              className="text-center text-xs font-semibold text-slate-600 hover:text-slate-900 pt-2 border-t border-slate-100"
            >
              Manage All Tasks →
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK NEW TASK MODAL */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Add Nursing Task</h3>
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Check post-op vitals, Administer pain reliever"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-[#00355f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Due Time
                  </label>
                  <input
                    type="text"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Room / Station
                  </label>
                  <input
                    type="text"
                    value={taskRoom}
                    onChange={(e) => setTaskRoom(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Priority
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={taskPriority === "normal"}
                      onChange={() => setTaskPriority("normal")}
                    />
                    <span>Normal</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-rose-700 cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      checked={taskPriority === "urgent"}
                      onChange={() => setTaskPriority("urgent")}
                    />
                    <span className="font-semibold">Urgent</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTask}
                  className="px-4 py-1.5 rounded-lg bg-[#00355f] text-white text-xs font-semibold hover:bg-[#0f4c81]"
                >
                  {savingTask ? "Saving..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
