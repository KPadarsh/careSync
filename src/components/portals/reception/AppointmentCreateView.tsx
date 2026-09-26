"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icons } from "./ReceptionIcons";

interface PatientOption {
  _id: string;
  mrn: string;
  user: { name: string; email: string; phone: string };
  gender?: string;
  dateOfBirth?: string;
}

interface DoctorOption {
  _id: string;
  name: string;
  specialty: string;
  department: string;
  roomNumber: string;
  workingHours: { start: string; end: string };
  avatar?: string;
}

const TIME_SLOTS = [
  "08:30 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
];

export function AppointmentCreateView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId") || "";
  const preselectedFollowUpId = searchParams.get("followUpId") || "";

  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState(preselectedPatientId);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedSlot, setSelectedSlot] = useState("09:30 AM");
  const [visitType, setVisitType] = useState<"in-person" | "teleconsultation">("in-person");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingData(true);
        const [patRes, docRes] = await Promise.all([
          fetch("/api/reception/patients?limit=50"),
          fetch("/api/reception/doctors"),
        ]);

        if (patRes.ok) {
          const patData = await patRes.json();
          setPatients(patData.patients || []);
        }
        if (docRes.ok) {
          const docData = await docRes.json();
          setDoctors(docData.doctors || []);
          if (docData.doctors?.length > 0 && !selectedDoctorId) {
            setSelectedDoctorId(docData.doctors[0]._id);
          }
        }
      } catch {
        // silently fallback
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [selectedDoctorId]);

  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const query = patientSearch.toLowerCase();
    return (
      p.user?.name?.toLowerCase().includes(query) ||
      p.mrn?.toLowerCase().includes(query) ||
      p.user?.phone?.includes(query)
    );
  });

  const selectedPatient = patients.find((p) => p._id === selectedPatientId);
  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setErrorMessage("Please select a patient.");
      return;
    }
    if (!selectedDoctorId) {
      setErrorMessage("Please select a physician.");
      return;
    }
    if (!reason.trim()) {
      setErrorMessage("Please specify the clinical reason for the visit.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await fetch("/api/reception/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatientId,
          doctorId: selectedDoctorId,
          date: selectedDate,
          timeSlot: selectedSlot,
          type: visitType,
          reason: reason.trim(),
          notes: notes.trim(),
          followUpId: preselectedFollowUpId || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to schedule appointment");
      }

      router.push(`/reception/appointments/${json.appointment._id}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/reception/appointments" className="hover:text-teal-700">
              Appointments
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">New Booking</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#00355f]">
            Schedule Appointment
          </h1>
          <p className="text-xs text-slate-500">
            Book an outpatient consultation slot with validated physician availability.
          </p>
        </div>

        <Link
          href="/reception/appointments"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs self-start"
        >
          <Icons.ChevronLeft className="w-3.5 h-3.5" />
          <span>Back to List</span>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-900 text-xs">
          <Icons.AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2-COLS: STEP BY STEP FORM */}
        <div className="lg:col-span-2 space-y-5">
          {/* STEP 1: PATIENT SELECTION */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                  1
                </span>
                <h2 className="text-sm font-bold text-slate-900">Select Patient</h2>
              </div>
              <Link
                href="/reception/patients/new"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900"
              >
                + Register New Patient
              </Link>
            </div>

            {selectedPatient ? (
              <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-xs">
                    {selectedPatient.user?.name?.slice(0, 2).toUpperCase() || "PT"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{selectedPatient.user?.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {selectedPatient.mrn} • {selectedPatient.user?.phone || "No phone"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatientId("")}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Type patient name, MRN, or phone number to search..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
                />

                <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                  {filteredPatients.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No patients found. Click &quot;Register New Patient&quot; above.
                    </div>
                  ) : (
                    filteredPatients.slice(0, 8).map((p) => (
                      <div
                        key={p._id}
                        onClick={() => setSelectedPatientId(p._id)}
                        className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{p.user?.name}</p>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {p.mrn} • {p.user?.phone}
                          </span>
                        </div>
                        <span className="text-teal-700 font-semibold text-[11px]">Select</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: DOCTOR SELECTION */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                2
              </span>
              <h2 className="text-sm font-bold text-slate-900">Select Attending Physician</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctors.map((doc) => {
                const isSelected = selectedDoctorId === doc._id;
                return (
                  <div
                    key={doc._id}
                    onClick={() => setSelectedDoctorId(doc._id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/40 ring-1 ring-teal-600"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {doc.name.replace("Dr. ", "").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{doc.name}</p>
                        <p className="text-[10px] text-teal-700 font-medium">{doc.specialty}</p>
                        <p className="text-[10px] text-slate-400">{doc.roomNumber}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 3: DATE & TIME SLOT */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                3
              </span>
              <h2 className="text-sm font-bold text-slate-900">Select Date &amp; Time Slot</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Appointment Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-60 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Available Time Slots
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      type="button"
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-2 text-xs font-medium rounded-lg border text-center transition-all ${
                        isSelected
                          ? "bg-[#00355f] text-white border-[#00355f] shadow-xs font-semibold"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 4: REASON & TYPE */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs">
                4
              </span>
              <h2 className="text-sm font-bold text-slate-900">Visit Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Encounter Type
                </label>
                <select
                  value={visitType}
                  onChange={(e) => setVisitType(e.target.value as "in-person" | "teleconsultation")}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                >
                  <option value="in-person">In-Person Consultation</option>
                  <option value="teleconsultation">Teleconsultation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Primary Chief Complaint / Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Routine hypertension checkup / Joint pain review"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-teal-500 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Internal Reception Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional internal desk notes or patient preferences..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 1-COL: SUMMARY & CONFIRMATION CARD */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs p-5 space-y-4 sticky top-6">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Booking Confirmation Summary
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Patient</span>
                <p className="font-bold text-slate-900">
                  {selectedPatient ? selectedPatient.user?.name : "Not selected"}
                </p>
                {selectedPatient && (
                  <p className="font-mono text-[11px] text-slate-500">{selectedPatient.mrn}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Doctor &amp; Room</span>
                <p className="font-bold text-slate-900">
                  {selectedDoctor ? selectedDoctor.name : "Not selected"}
                </p>
                {selectedDoctor && (
                  <p className="text-[11px] text-slate-500">
                    {selectedDoctor.department} • {selectedDoctor.roomNumber}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Schedule</span>
                <p className="font-bold text-teal-800 text-sm">
                  {selectedDate} at {selectedSlot}
                </p>
                <span className="text-[10px] text-slate-500 capitalize">{visitType} visit</span>
              </div>

              {reason && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Reason</span>
                  <p className="text-slate-700 font-medium italic">&quot;{reason}&quot;</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#006a68] hover:bg-[#005452] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Booking Slot...</span>
                  </>
                ) : (
                  <>
                    <Icons.Check className="w-4 h-4" />
                    <span>Confirm Booking</span>
                  </>
                )}
              </button>

              <Link
                href="/reception/appointments"
                className="block text-center py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
