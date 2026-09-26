"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  department: string;
  qualification: string;
  roomNumber: string;
  avatar?: string;
  availableDays: string[];
}

interface Appointment {
  _id: string;
  patientId: string;
  doctorId: Doctor;
  date: string;
  timeSlot: string;
  type: string;
  reason: string;
  status: "confirmed" | "scheduled" | "in-progress" | "completed" | "cancelled" | "rescheduled";
  bookedBy: "PATIENT" | "RECEPTION" | "DOCTOR";
  cancellationReason?: string;
  notes?: string;
}

export function AppointmentsView() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [showBookingModal, setShowBookingModal] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!new URLSearchParams(window.location.search).get("doctorId");
    }
    return false;
  });
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Booking form state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("doctorId") || "";
    }
    return "";
  });
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [bookingTimeSlot, setBookingTimeSlot] = useState<string>("");
  const [bookingReason, setBookingReason] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("reason") || "";
    }
    return "";
  });
  const [bookingType, setBookingType] = useState<string>("in-person");
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3>(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("doctorId")) {
      return 2;
    }
    return 1;
  });

  // Reschedule form state
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<{ time: string; available: boolean }[]>([]);

  // Load appointments
  const fetchAppointments = () => {
    fetch("/api/patient/appointments")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.all) {
          setAppointments(data.all);
        }
      })
      .catch((err) => console.error("Error loading appointments:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAppointments();
    // Load doctors and departments
    fetch("/api/patient/doctors")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDoctors(data.doctors);
          setDepartments(["All", ...data.departments]);
          setSelectedDoctorId((prev) => prev || (data.doctors.length > 0 ? data.doctors[0]._id : ""));
        }
      })
      .catch((err) => console.error("Error loading doctors:", err));
  }, []);

  // Fetch slots whenever doctor or date changes in booking modal
  useEffect(() => {
    if (!selectedDoctorId || !bookingDate) return;
    let cancelled = false;

    fetch(`/api/patient/doctors/${selectedDoctorId}/availability?date=${bookingDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && data.slots) {
          setAvailableSlots(data.slots);
          const firstAvailable = data.slots.find((s: { time: string; available: boolean }) => s.available);
          if (firstAvailable) setBookingTimeSlot(firstAvailable.time);
        }
      })
      .catch((err) => console.error("Error loading slots:", err))
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDoctorId, bookingDate]);

  // Fetch slots for reschedule modal
  useEffect(() => {
    if (!selectedAppointment?.doctorId?._id || !rescheduleDate) return;
    let cancelled = false;

    fetch(`/api/patient/doctors/${selectedAppointment.doctorId._id}/availability?date=${rescheduleDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && data.slots) {
          setRescheduleSlots(data.slots);
          const firstAvailable = data.slots.find((s: { time: string; available: boolean }) => s.available);
          if (firstAvailable) setRescheduleTimeSlot(firstAvailable.time);
        }
      })
      .catch((err) => console.error("Error loading reschedule slots:", err));

    return () => {
      cancelled = true;
    };
  }, [selectedAppointment, rescheduleDate]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !bookingDate || !bookingTimeSlot || !bookingReason.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setActionLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/patient/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          date: bookingDate,
          timeSlot: bookingTimeSlot,
          type: bookingType,
          reason: bookingReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to book appointment");
        setActionLoading(false);
        return;
      }

      setShowBookingModal(false);
      setBookingStep(1);
      setBookingReason("");
      fetchAppointments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    setActionLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/patient/appointments/${selectedAppointment._id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to cancel appointment");
        setActionLoading(false);
        return;
      }

      setShowCancelModal(false);
      setSelectedAppointment(null);
      setCancelReason("");
      fetchAppointments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppointment || !rescheduleDate || !rescheduleTimeSlot) return;

    setActionLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/patient/appointments/${selectedAppointment._id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: rescheduleDate,
          timeSlot: rescheduleTimeSlot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to reschedule appointment");
        setActionLoading(false);
        return;
      }

      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredAppointments = appointments.filter((item) => {
    const apptDate = new Date(item.date);
    if (activeTab === "upcoming") {
      if (apptDate < today || item.status === "cancelled" || item.status === "completed") return false;
    } else if (activeTab === "past") {
      if (apptDate >= today && item.status !== "completed") return false;
    } else if (activeTab === "cancelled") {
      if (item.status !== "cancelled") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDoc = item.doctorId?.name?.toLowerCase().includes(q);
      const matchSpec = item.doctorId?.specialty?.toLowerCase().includes(q);
      const matchReason = item.reason?.toLowerCase().includes(q);
      return matchDoc || matchSpec || matchReason;
    }
    return true;
  });

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  return (
    <div className="space-y-6">
      {/* Header & Book Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0b1c30] tracking-tight">Appointments</h2>
          <p className="text-sm text-[#45464d] mt-1">
            Book doctor consultations, manage upcoming schedules, and review visit history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowBookingModal(true);
            setBookingStep(1);
            setErrorMessage("");
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#131b2e] text-white text-sm font-semibold rounded-lg hover:bg-[#213145] transition-colors cursor-pointer shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Book New Appointment
        </button>
      </div>

      {/* Main Table Card Container */}
      <Card className="overflow-hidden border border-[#e2e8f0] shadow-sm">
        {/* Navigation Tabs */}
        <div className="border-b border-[#e2e8f0] px-4 flex items-center gap-2 bg-[#eff4ff]/30">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "upcoming"
                ? "border-[#131b2e] text-[#131b2e]"
                : "border-transparent text-[#45464d] hover:text-[#0b1c30]"
            }`}
          >
            Upcoming (
            {
              appointments.filter(
                (a) => new Date(a.date) >= today && a.status !== "cancelled" && a.status !== "completed"
              ).length
            }
            )
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "past"
                ? "border-[#131b2e] text-[#131b2e]"
                : "border-transparent text-[#45464d] hover:text-[#0b1c30]"
            }`}
          >
            Past &amp; Completed (
            {appointments.filter((a) => new Date(a.date) < today || a.status === "completed").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "cancelled"
                ? "border-[#131b2e] text-[#131b2e]"
                : "border-transparent text-[#45464d] hover:text-[#0b1c30]"
            }`}
          >
            Cancelled ({appointments.filter((a) => a.status === "cancelled").length})
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white border-b border-[#e2e8f0] flex flex-wrap gap-3 items-center justify-between">
          <div className="relative min-w-[240px] flex-1 sm:flex-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#45464d]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search doctor, specialty, reason..."
              className="w-full bg-[#eff4ff] border-none rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0b1c30] placeholder:text-[#45464d] focus:outline-none focus:ring-1 focus:ring-[#131b2e]"
            />
          </div>
        </div>

        {/* Appointments List (Responsive: Desktop Table / Mobile Cards) */}
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#45464d]">
            <div className="w-12 h-12 rounded-full bg-[#eff4ff] text-[#006a61] mx-auto flex items-center justify-center mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="font-semibold text-[#0b1c30]">No appointments found</p>
            <p className="text-xs text-[#45464d] mt-1">There are no appointments matching this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-[#eff4ff]/60 text-[#45464d] text-xs font-semibold uppercase tracking-wider border-b border-[#e2e8f0]">
                  <th className="py-3 px-4">Doctor / Specialty</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {filteredAppointments.map((item) => {
                  const isUpcoming = new Date(item.date) >= today && item.status !== "cancelled";

                  return (
                    <tr key={item._id} className="hover:bg-[#eff4ff]/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-center text-xs font-bold text-[#131b2e] shrink-0">
                            {item.doctorId?.name
                              ? item.doctorId.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                              : "DR"}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#0b1c30]">
                              {item.doctorId?.name || "Consulting Doctor"}
                            </div>
                            <div className="text-xs text-[#45464d]">
                              {item.doctorId?.specialty || "General Medicine"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#45464d]">
                        {item.doctorId?.roomNumber || "Main Clinic"}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-[#0b1c30]">
                          {new Date(item.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-[#45464d]">{item.timeSlot}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#0b1c30] max-w-[200px] truncate" title={item.reason}>
                        {item.reason}
                      </td>

                      <td className="py-3.5 px-4">
                        {item.status === "confirmed" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#22c55e]/10 text-[#22c55e]">
                            Confirmed
                          </span>
                        )}
                        {item.status === "scheduled" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#3b82f6]/10 text-[#3b82f6]">
                            Scheduled
                          </span>
                        )}
                        {item.status === "completed" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            Completed
                          </span>
                        )}
                        {item.status === "cancelled" && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ba1a1a]/10 text-[#ba1a1a]">
                            Cancelled
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isUpcoming && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAppointment(item);
                                  const d = new Date(item.date);
                                  setRescheduleDate(d.toISOString().split("T")[0]);
                                  setShowRescheduleModal(true);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-[#131b2e] hover:bg-[#eff4ff] rounded border border-[#e2e8f0] cursor-pointer transition-colors"
                              >
                                Reschedule
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAppointment(item);
                                  setShowCancelModal(true);
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded border border-[#ffdad6] cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* 1. BOOK APPOINTMENT MODAL (Full 3-Step Flow per Stitch Designs)            */}
      {/* ========================================================================= */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header with Steps Indicator */}
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#0b1c30]">
                  {bookingStep === 1 && "Step 1: Choose Department & Doctor"}
                  {bookingStep === 2 && "Step 2: Select Date & Available Time"}
                  {bookingStep === 3 && "Step 3: Confirm Consultation Booking"}
                </h3>
                <p className="text-xs text-[#45464d] mt-0.5">
                  Book directly with available clinical specialists
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="text-[#45464d] hover:text-[#0b1c30] p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            {/* STEP 1: Select Department & Doctor */}
            {bookingStep === 1 && (
              <div className="space-y-4">
                {/* Department filter */}
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setSelectedDept(dept)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                        selectedDept === dept
                          ? "bg-[#131b2e] text-white"
                          : "bg-[#eff4ff] text-[#45464d] hover:text-[#0b1c30]"
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>

                {/* Doctors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto p-1">
                  {doctors
                    .filter((d) => selectedDept === "All" || d.department === selectedDept)
                    .map((doc) => (
                      <div
                        key={doc._id}
                        onClick={() => setSelectedDoctorId(doc._id)}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          selectedDoctorId === doc._id
                            ? "border-[#006a61] bg-[#89f5e7]/10 shadow-sm"
                            : "border-[#e2e8f0] hover:border-[#131b2e]/40 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#eff4ff] flex items-center justify-center font-bold text-xs text-[#131b2e]">
                            {doc.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#0b1c30]">{doc.name}</h4>
                            <p className="text-xs text-[#006a61] font-medium">{doc.specialty}</p>
                            <p className="text-[11px] text-[#45464d]">{doc.roomNumber}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="flex justify-end pt-3 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedDoctorId) {
                        setErrorMessage("Please select a doctor to proceed");
                        return;
                      }
                      setErrorMessage("");
                      setBookingStep(2);
                    }}
                    className="px-5 py-2 bg-[#131b2e] text-white text-xs font-semibold rounded-lg hover:bg-[#213145] cursor-pointer"
                  >
                    Continue to Date &amp; Time →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Select Date & Available Time Slot */}
            {bookingStep === 2 && (
              <form onSubmit={(e) => { e.preventDefault(); setBookingStep(3); }} className="space-y-4">
                <div className="bg-[#eff4ff]/60 p-3 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#45464d]">Selected Specialist: </span>
                    <strong className="text-[#0b1c30]">{selectedDoctor?.name}</strong> (
                    {selectedDoctor?.specialty})
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className="text-[#006a61] font-semibold hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date picker */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                      Consultation Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                      required
                      className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#131b2e]"
                    />
                  </div>

                  {/* Consultation Type */}
                  <div>
                    <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                      Consultation Type
                    </label>
                    <select
                      value={bookingType}
                      onChange={(e) => setBookingType(e.target.value)}
                      className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#0b1c30] focus:outline-none focus:ring-1 focus:ring-[#131b2e] cursor-pointer"
                    >
                      <option value="in-person">In-Person Clinic Visit</option>
                      <option value="video-consultation">Telehealth / Video Call</option>
                      <option value="follow-up">Follow-up Checkup</option>
                    </select>
                  </div>
                </div>

                {/* Slots selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1.5">
                    Available Time Slots (Server-Verified)
                  </label>
                  {slotsLoading ? (
                    <div className="p-4 text-center text-xs text-[#45464d]">Checking real-time doctor availability...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-4 text-center text-xs text-red-600 bg-red-50 rounded-lg">
                      Doctor has no available time slots on this date. Please pick another date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={!slot.available}
                          onClick={() => setBookingTimeSlot(slot.time)}
                          className={`py-2 px-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                            !slot.available
                              ? "bg-slate-100 text-slate-400 line-through cursor-not-allowed"
                              : bookingTimeSlot === slot.time
                              ? "bg-[#131b2e] text-white shadow-sm"
                              : "bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                    Reason for Consultation
                  </label>
                  <textarea
                    rows={2}
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    required
                    placeholder="Briefly describe your symptoms or reason for visit..."
                    className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2.5 text-xs text-[#0b1c30] placeholder:text-[#45464d] focus:outline-none focus:ring-1 focus:ring-[#131b2e]"
                  />
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => setBookingStep(1)}
                    className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#45464d] hover:bg-slate-50 cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={!bookingTimeSlot || !bookingReason.trim()}
                    className="px-5 py-2 bg-[#131b2e] text-white text-xs font-semibold rounded-lg hover:bg-[#213145] disabled:opacity-50 cursor-pointer"
                  >
                    Review Details →
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Review & Confirm */}
            {bookingStep === 3 && (
              <div className="space-y-4">
                <div className="bg-[#eff4ff] rounded-xl p-5 border border-[#dce9ff] space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-[#dce9ff]">
                    <span className="text-xs text-[#45464d]">Physician:</span>
                    <strong className="text-xs text-[#0b1c30]">{selectedDoctor?.name}</strong>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#dce9ff]">
                    <span className="text-xs text-[#45464d]">Department:</span>
                    <strong className="text-xs text-[#0b1c30]">{selectedDoctor?.department}</strong>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#dce9ff]">
                    <span className="text-xs text-[#45464d]">Date &amp; Time:</span>
                    <strong className="text-xs text-[#0b1c30]">
                      {new Date(bookingDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })} at {bookingTimeSlot}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-[#dce9ff]">
                    <span className="text-xs text-[#45464d]">Location:</span>
                    <strong className="text-xs text-[#0b1c30]">{selectedDoctor?.roomNumber}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-[#45464d] block mb-1">Reason:</span>
                    <p className="text-xs font-medium text-[#0b1c30] bg-white p-2.5 rounded border border-[#e2e8f0]">
                      {bookingReason}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => setBookingStep(2)}
                    className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#45464d] hover:bg-slate-50 cursor-pointer"
                  >
                    ← Edit
                  </button>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={handleCreateAppointment}
                    className="px-6 py-2.5 bg-[#006a61] text-white text-xs font-bold rounded-lg hover:bg-[#005049] transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {actionLoading ? "Confirming Booking..." : "Confirm & Book Appointment"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RESCHEDULE MODAL                                                       */}
      {/* ========================================================================= */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#0b1c30]">
              Reschedule Appointment with {selectedAppointment.doctorId?.name}
            </h3>
            <p className="text-xs text-[#45464d]">
              Current schedule: {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.timeSlot}
            </p>

            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleRescheduleAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                  className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg px-3 py-2 text-xs text-[#0b1c30]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                  Select New Time Slot
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {rescheduleSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => setRescheduleTimeSlot(slot.time)}
                      className={`py-2 px-1 text-xs rounded-lg font-semibold transition-all ${
                        !slot.available
                          ? "bg-slate-100 text-slate-400 line-through cursor-not-allowed"
                          : rescheduleTimeSlot === slot.time
                          ? "bg-[#131b2e] text-white"
                          : "bg-[#eff4ff] text-[#0b1c30] hover:bg-[#dce9ff]"
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#45464d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rescheduleTimeSlot}
                  className="px-5 py-2 bg-[#131b2e] text-white text-xs font-semibold rounded-lg hover:bg-[#213145]"
                >
                  {actionLoading ? "Updating..." : "Save Reschedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. CANCEL MODAL                                                           */}
      {/* ========================================================================= */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#ba1a1a]">Cancel Appointment</h3>
            <p className="text-xs text-[#45464d]">
              Are you sure you want to cancel your consultation with{" "}
              <strong>{selectedAppointment.doctorId?.name}</strong> on{" "}
              {new Date(selectedAppointment.date).toLocaleDateString()} at {selectedAppointment.timeSlot}?
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#0b1c30] mb-1">
                Reason for cancellation (optional)
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Schedule conflict, feeling better, etc."
                className="w-full bg-[#eff4ff] border border-[#e2e8f0] rounded-lg p-2.5 text-xs text-[#0b1c30]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-[#e2e8f0] rounded-lg text-xs font-medium text-[#45464d]"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancelAppointment}
                className="px-5 py-2 bg-[#ba1a1a] text-white text-xs font-semibold rounded-lg hover:bg-[#93000a]"
              >
                {actionLoading ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
