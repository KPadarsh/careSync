"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Icons } from "./ReceptionIcons";

interface AppointmentDetailData {
  appointment: {
    _id: string;
    patientId: {
      _id: string;
      mrn: string;
      phone: string;
      bloodGroup?: string;
      gender?: string;
      userId: { name: string; email: string; phone: string; avatar?: string };
    };
    doctorId: {
      _id: string;
      name: string;
      specialty: string;
      department: string;
      roomNumber: string;
      avatar?: string;
      workingHours?: { start: string; end: string };
    };
    date: string;
    timeSlot: string;
    type: string;
    reason: string;
    status: string;
    bookedBy: string;
    notes?: string;
    cancellationReason?: string;
    createdAt: string;
  };
  queueEntry?: {
    ticketNumber: string;
    status: string;
    priority: string;
    checkedInTime: string;
    roomNumber: string;
  } | null;
}

const RESCHEDULE_SLOTS = [
  "08:30 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
];

export function AppointmentDetailView() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<AppointmentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check in action
  const [checkingIn, setCheckingIn] = useState(false);

  // Reschedule modal
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Cancel modal
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointment = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/reception/appointments/${id}`);
      if (!res.ok) throw new Error("Failed to load appointment details");
      const json = await res.json();
      setData(json);
      setRescheduleDate(json.appointment?.date?.split("T")[0] || "");
      setRescheduleSlot(json.appointment?.timeSlot || "09:30 AM");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading appointment");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const res = await fetch(`/api/reception/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check-in" }),
      });
      if (res.ok) {
        await fetchAppointment();
      } else {
        alert("Check-in could not be completed.");
      }
    } catch {
      alert("Error performing check-in.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleSlot) return;
    try {
      setRescheduling(true);
      const res = await fetch(`/api/reception/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          newDate: rescheduleDate,
          newTimeSlot: rescheduleSlot,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to reschedule");
      setShowReschedule(false);
      await fetchAppointment();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to reschedule");
    } finally {
      setRescheduling(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCancelling(true);
      const res = await fetch(`/api/reception/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          cancellationReason: cancelReason || "Cancelled by patient at reception desk",
        }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      setShowCancel(false);
      await fetchAppointment();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error cancelling appointment");
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500">Loading appointment details...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-3 max-w-lg mx-auto">
        <Icons.AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Appointment Not Found</h3>
        <p className="text-xs text-rose-700">{error || "Could not retrieve appointment record."}</p>
        <Link
          href="/reception/appointments"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
        >
          <Icons.ChevronLeft className="w-4 h-4" />
          <span>Return to Appointments</span>
        </Link>
      </div>
    );
  }

  const { appointment, queueEntry } = data;
  const isCheckedIn = appointment.status === "checked-in";
  const isConfirmed = appointment.status === "confirmed" || appointment.status === "scheduled";
  const isCompleted = appointment.status === "completed";
  const isCancelled = appointment.status === "cancelled";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* BREADCRUMB */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/reception/appointments" className="hover:text-teal-700">
            Appointments
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Encounter Detail</span>
        </div>
        <Link
          href="/reception/appointments"
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
        >
          <Icons.ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to List</span>
        </Link>
      </div>

      {/* HERO CARD */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900">
                {appointment.timeSlot} — {new Date(appointment.date).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h1>
              {isCheckedIn && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
                  Checked-in
                </span>
              )}
              {isConfirmed && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  Confirmed
                </span>
              )}
              {isCompleted && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  Completed
                </span>
              )}
              {isCancelled && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                  Cancelled
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Encounter ID: <span className="font-mono">{appointment._id}</span> • Booked via {appointment.bookedBy}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            {isConfirmed && (
              <button
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#006a68] hover:bg-[#005452] rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                <Icons.Check className="w-4 h-4" />
                <span>{checkingIn ? "Checking In..." : "Check In Patient"}</span>
              </button>
            )}

            {!isCancelled && !isCompleted && (
              <>
                <button
                  onClick={() => setShowReschedule(true)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => setShowCancel(true)}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg"
                >
                  Cancel
                </button>
              </>
            )}

            <button
              onClick={() => window.print()}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg"
              title="Print Encounter Slip"
            >
              <Icons.Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PROGRESS LIFECYCLE BAR */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span className="text-teal-800">1. Scheduled</span>
            <span className={isCheckedIn || isCompleted ? "text-teal-800" : ""}>2. Checked-in</span>
            <span className={isCompleted ? "text-teal-800" : ""}>3. Completed</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
            <div className="w-1/3 bg-teal-600" />
            <div className={`w-1/3 ${isCheckedIn || isCompleted ? "bg-teal-600" : "bg-slate-200"}`} />
            <div className={`w-1/3 ${isCompleted ? "bg-teal-600" : "bg-slate-200"}`} />
          </div>
        </div>
      </div>

      {/* QUEUE TICKET BANNER (IF CHECKED IN) */}
      {queueEntry && (
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold px-3 py-1 bg-slate-900 text-white rounded-lg">
              {queueEntry.ticketNumber}
            </span>
            <div>
              <p className="font-bold text-teal-950">Active Lounge Queue Token</p>
              <p className="text-teal-700 text-[11px]">
                Assigned to {queueEntry.roomNumber} • Priority: <strong className="uppercase">{queueEntry.priority}</strong>
              </p>
            </div>
          </div>
          <Link
            href="/reception/queue"
            className="px-3 py-1.5 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-lg"
          >
            View Live Queue
          </Link>
        </div>
      )}

      {/* 2-COLUMN PATIENT & CLINIC DETAILS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PATIENT PROFILE CARD */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Patient Identity
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm shrink-0">
              {appointment.patientId?.userId?.name?.slice(0, 2).toUpperCase() || "PT"}
            </div>
            <div>
              <Link
                href={`/reception/patients/${appointment.patientId?._id}`}
                className="font-bold text-slate-900 hover:text-teal-700 text-sm block"
              >
                {appointment.patientId?.userId?.name}
              </Link>
              <span className="font-mono text-xs text-slate-500 font-medium">
                {appointment.patientId?.mrn}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
            <p>
              <strong className="text-slate-800 font-medium">Contact:</strong>{" "}
              {appointment.patientId?.phone || appointment.patientId?.userId?.phone || "No phone"}
            </p>
            <p>
              <strong className="text-slate-800 font-medium">Email:</strong>{" "}
              {appointment.patientId?.userId?.email || "No email"}
            </p>
            {appointment.patientId?.bloodGroup && (
              <p>
                <strong className="text-slate-800 font-medium">Blood Group:</strong>{" "}
                {appointment.patientId.bloodGroup}
              </p>
            )}
          </div>
        </div>

        {/* PHYSICIAN & LOCATION CARD */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Attending Physician &amp; Location
          </h2>
          <div>
            <p className="font-bold text-slate-900 text-sm">{appointment.doctorId?.name}</p>
            <p className="text-xs text-teal-700 font-semibold">{appointment.doctorId?.specialty}</p>
            <p className="text-xs text-slate-500 mt-1">
              Department: {appointment.doctorId?.department}
            </p>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              Consultation Room: {appointment.doctorId?.roomNumber}
            </p>
          </div>
        </div>

        {/* CLINICAL VISIT REASON */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Visit Description &amp; Chief Complaint
          </h2>
          <div className="text-xs text-slate-700 space-y-2">
            <div>
              <span className="font-semibold text-slate-500 block text-[10px] uppercase">Reason for Visit</span>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{appointment.reason}</p>
            </div>
            {appointment.notes && (
              <div className="pt-2">
                <span className="font-semibold text-slate-500 block text-[10px] uppercase">Reception Desk Notes</span>
                <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 mt-1">
                  {appointment.notes}
                </p>
              </div>
            )}
            {appointment.cancellationReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                <span className="font-bold block">Cancellation Note:</span>
                <p>{appointment.cancellationReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RESCHEDULE MODAL */}
      {showReschedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Reschedule Appointment</h3>
              <button onClick={() => setShowReschedule(false)} className="text-slate-400 hover:text-slate-700">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Select New Time Slot</label>
                <div className="grid grid-cols-3 gap-2">
                  {RESCHEDULE_SLOTS.map((slot) => (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setRescheduleSlot(slot)}
                      className={`p-2 rounded-lg border text-center font-medium ${
                        rescheduleSlot === slot
                          ? "bg-[#00355f] text-white border-[#00355f]"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReschedule(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-4 py-1.5 text-white bg-teal-600 hover:bg-teal-700 font-semibold rounded-lg shadow-xs"
                >
                  {rescheduling ? "Updating..." : "Confirm New Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {showCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-rose-900">Cancel Appointment</h3>
              <button onClick={() => setShowCancel(false)} className="text-slate-400 hover:text-slate-700">
                <Icons.X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <p className="text-slate-600">
                Are you sure you want to cancel this booking? If the patient is waiting in queue, their ticket will also be cancelled.
              </p>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Reason for Cancellation</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Patient called to cancel / Unable to attend / Doctor unavailable"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCancel(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-1.5 text-white bg-rose-600 hover:bg-rose-700 font-semibold rounded-lg shadow-xs"
                >
                  {cancelling ? "Cancelling..." : "Cancel Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
